import { Context, Session, Injector } from ".";
import { createInjectionArg, getProviderDef, injectableMixin } from "../decorators";
import { 
  Provider, TypeProvider,
  InstanceRecord, DefinitionRecord, ProviderRecord,
  ProviderDef, FactoryDef, Type,
  InjectionOptions, InjectionSession, ConstraintDef, InjectionMetadata, WrapperDef, InjectionArgument, ComponentRecord, ComponentInstanceRecord, PlainProvider,
} from "../interfaces";
import { isFactoryProvider, isValueProvider, isClassProvider, isExistingProvider, hasWrapperProvider, isWrapper } from "../utils";
import { InjectionStatus } from "../enums";
import { Token } from "../types";
import { Scope } from "../scope";
import { STATIC_CONTEXT, ALWAYS_CONSTRAINT } from "../constants";
import { Skip, useDefaultHooks } from "../wrappers";
import { Cacheable } from "../wrappers/cacheable";

import { InjectorResolver } from "./resolver";
import { NilInjector } from "./injector";

export const InjectorMetadata = new class {
  /**
   * PROVIDERS
   */
  toRecord<T>(
    provider: Provider<T>,
    hostInjector: Injector,
  ): ProviderRecord {
    if (typeof provider === "function") {
      return this.typeProviderToRecord(provider, hostInjector);
    } else {
      return this.customProviderToRecord(provider.provide, provider, hostInjector);
    }
  }

  typeProviderToRecord<T>(
    provider: TypeProvider<T>,
    hostInjector: Injector,
  ): ProviderRecord {
    const provDef = this.getProviderDef(provider);
    const options = provDef.options || {};

    if (
      'useWrapper' in options || 
      'useFactory' in options ||
      'useValue' in options ||
      'useExisting' in options ||
      'useClass' in options
    ) {
      // shallow copy provDef
      const customProvider = { ...options, useClass: provider } as PlainProvider;
      return this.customProviderToRecord(provider, customProvider, hostInjector);
    }

    const record = this.getRecord(provider, hostInjector);
    const def = this.createDefinitionRecord(record, provDef.factory, provDef.scope, undefined, undefined, provider.prototype);
    record.defs.push(def);
    return record;
  }

  customProviderToRecord<T>(
    token: Token<T>,
    provider: PlainProvider<T>,
    hostInjector: Injector,
  ): ProviderRecord {
    const record = this.getRecord(token, hostInjector);
    let factory: FactoryDef = undefined,
      scope: Scope = (provider as any).scope,
      proto = undefined;

    if (isFactoryProvider(provider)) {
      const deps = this.convertDependencies(provider.inject || [], provider.useFactory);
      factory = (injector: Injector, session?: Session) => {
        return provider.useFactory(...InjectorResolver.injectDeps(deps, injector, session));
      }
    } else if (isValueProvider(provider)) {
      factory = () => provider.useValue;
      scope = Scope.SINGLETON;
    }  else if (isExistingProvider(provider)) {
      const aliasProvider = provider.useExisting;
      let changed = false;
      factory = (injector: Injector, session?: Session) => {
        // save reference of record of existing provider to record created for useExisting
        // in other words change record from useExisting provider to record pointed by useExisting token
        if (changed === false) {
          const deepRecord = this.retrieveDeepRecord(aliasProvider, injector);
          if (deepRecord !== undefined) {
            (injector as any).records.set(provider.provide, deepRecord);
            changed = true;
          }
        }
        return injector.get(aliasProvider, session.options, session.meta, session);
      }
    } else if (isClassProvider(provider)) {
      const classRef = provider.useClass;
      const providerDef = this.getProviderDef(classRef, true);
      factory = InjectorResolver.createFactory(classRef, providerDef);
      proto = classRef;
    } 
    // else if (isCustomProvider(provider)) {
    //   const customDef = provider.useCustom;
    //   const providerDef = this.getProviderDef(classRef, true);
    //   factory = InjectorResolver.createFactory(classRef, providerDef);
    //   proto = classRef;
    // }

    const constraint = provider.when;
    let useWrapper = undefined;
    if (hasWrapperProvider(provider)) {
      useWrapper = provider.useWrapper;

      // case with standalone `useWrapper`
      if (factory === undefined) {
        record.wrappers.push({
          useWrapper: useWrapper,
          constraint: constraint || ALWAYS_CONSTRAINT,
        });
        return record;
      }
    }

    const def = this.createDefinitionRecord(record, factory, scope, constraint, useWrapper, proto);
    if (constraint === undefined) {
      record.defs.push(def);
    } else {
      record.constraintDefs.push(def);  
    }

    return record;
  }

  createProviderRecord<T>(
    token: Token<T>,
    hostInjector: Injector,
    // useWrapper: WrapperDef,
  ): ProviderRecord<T> {
    return {
      token,
      hostInjector,
      defs: [],
      constraintDefs: [],
      wrappers: [],
      // wrappers: useWrapper ? [
      //   {
      //     useWrapper: useWrapper,
      //     constraint: ALWAYS_CONSTRAINT,
      //   }
      // ] : [],
    }
  }

  createDefinitionRecord(
    record: ProviderRecord,
    factory?: FactoryDef,
    scope?: Scope,
    constraint?: ConstraintDef,
    useWrapper?: WrapperDef,
    proto?: Type,
  ): DefinitionRecord {
    // if provider is a class provider, then apply hooks wrappers
    if (proto !== undefined) useWrapper = useDefaultHooks(useWrapper);
    return {
      record,
      factory,
      scope: scope || Scope.DEFAULT,
      constraint,
      useWrapper,
      proto: proto || undefined,
      values: new Map<Context, InstanceRecord>(),
    };
  }

  createInstanceRecord<T>(
    ctx: Context,
    value: T | undefined,
    def: DefinitionRecord<T>,
  ): InstanceRecord<T> {
    return {
      ctx,
      value,
      def,
      status: InjectionStatus.UNKNOWN,
    };
  }

  getRecord<T>(
    token: Token<T>,
    hostInjector: Injector,
  ): ProviderRecord {
    const records: Map<Token, ProviderRecord> = (hostInjector as any).records;
    let record = records.get(token);
    if (record === undefined) {
      // let useWrapper = undefined;
      // if (customProvider && hasWrapperProvider(customProvider)) {
      //   useWrapper = customProvider.useWrapper;
      // } else {
      //   // change this statement to something more optimize 
      //   const def = getProviderDef(token);
      //   if (def && def.options && hasWrapperProvider(def.options)) {
      //     useWrapper = def.options.useWrapper;
      //   }
      // }
      record = this.createProviderRecord(token, hostInjector);
      records.set(token, record);
    }
    return record;
  }

  getInstanceRecord<T>(
    def: DefinitionRecord<T>, 
    scope: Scope,
    session?: Session,
  ): InstanceRecord<T> {
    // session['$$sideEffects'] = scope.hasSideEffects();
    session.setSideEffect(scope.hasSideEffects());
    const ctx = scope.getContext(def, session) || STATIC_CONTEXT;

    let instance = def.values.get(ctx);
    if (instance === undefined) {
      instance = this.createInstanceRecord(ctx, undefined, def);
      def.values.set(ctx, instance);
      // if (scope.toCache(options, def, session) === true) {
      //   ctxRecord.status |= InjectionStatus.CACHED;
      //   def.values.set(ctx, ctxRecord);
      // }
    }
    session.instance = instance;

    return instance;
  }

  /**
   * COMPONENTS
   */
  toComponentRecord<T>(
    comp: Type<T>,
    useWrapper?: WrapperDef,
  ): ComponentRecord<T> {
    const def = this.getProviderDef(comp);
    useWrapper = useDefaultHooks(useWrapper);
    return {
      comp,
      factory: def.factory,
      scope: def.scope || Scope.SINGLETON,
      useWrapper,
      values: new Map<Context, ComponentInstanceRecord>(),
    };
  }

  createComponentInstanceRecord<T>(
    ctx: Context,
    value: T | undefined,
    comp: ComponentRecord<T>,
  ): ComponentInstanceRecord<T> {
    return {
      ctx,
      value,
      comp,
    };
  }

  getComponentInstanceRecord<T>(
    comp: ComponentRecord<T>, 
    scope: Scope,
    session?: Session,
  ): ComponentInstanceRecord<T> {
    const ctx = scope.getContext(comp as unknown as DefinitionRecord, session) || STATIC_CONTEXT;
    let instance = comp.values.get(ctx);
    if (instance === undefined) {
      instance = this.createComponentInstanceRecord(ctx, undefined, comp);
      comp.values.set(ctx, instance);
      // if (scope.toCache(options, def, session) === true) {
      //   ctxRecord.status |= InjectionStatus.CACHED;
      //   def.values.set(ctx, ctxRecord);
      // }
    }

    // TODO: FIX TYPES!!!
    (session.instance as any) = instance;
    return instance;
  }

  /**
   * HELPERS
   */
  createSession<T>(
    instance: InstanceRecord<T>,
    options: InjectionOptions,
    meta: InjectionMetadata,
    parent: InjectionSession,
  ): InjectionSession<T> {
    return {
      instance,
      options,
      meta,
      parent,
    };
  }

  copyOptions(options: InjectionOptions = {} as InjectionOptions): InjectionOptions {
    return { ...options, labels: { ...options.labels } };
  }

  getProviderDef<T>(token: Token<T>, throwError: boolean = true): ProviderDef {
    let providerDef = getProviderDef(token);
    if (!providerDef) {
      // using injectableMixin() as fallback for decorated classes with different decorator than @Injectable(), @Component() or @Module()
      // collect only constructor params
      typeof token === "function" && injectableMixin(token as Type);
      providerDef = getProviderDef(token);
      if (providerDef === undefined && throwError === true) {
        throw new Error('Cannot get provider def');
      }
    }
    return providerDef;
  }

  getFactoryDef<T>(token: Token<T>): FactoryDef<T> {
    const providerDef = this.getProviderDef(token);
    if (providerDef.factory === undefined) {
      throw new Error('Cannot get factory def')
    }
    return providerDef.factory;
  }

  convertDependencies(deps: Array<Token | WrapperDef>, factory: Function): InjectionArgument[] {
    const converted: InjectionArgument[] = [];
    for (let i = 0, l = deps.length; i < l; i++) {
      const dep = deps[i];
      if (isWrapper(dep)) {
        converted.push(createInjectionArg(undefined, Cacheable(dep), factory, undefined, i));
      } else {
        converted.push(createInjectionArg(dep, undefined, factory, undefined, i));
      }
    }
    return converted;
  }

  retrieveDeepRecord(token: Token, injector: Injector): ProviderRecord | undefined {
    let record: ProviderRecord = (injector as any).getRecord(token); 
    if (record !== undefined) {
      return record;
    }

    let parentInjector = injector.getParentInjector();
    while (parentInjector !== NilInjector) {
      if (record = (parentInjector as any).getRecord(token)) {
        return record;
      }
      parentInjector = parentInjector.getParentInjector();
    }
    return record;
  }
}
