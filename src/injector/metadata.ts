import { Context, Session, Injector } from ".";
import { createInjectionArg, getProviderDef, injectableMixin } from "../decorators";
import { 
  Provider, TypeProvider, DefinitionRecord,
  ProviderDef, FactoryDef, Type,
  InjectionOptions, WrapperDef, InjectionArgument, ComponentRecord, ComponentInstanceRecord, PlainProvider, InjectableOptions, ScopeShape, ScopeType,
} from "../interfaces";
import { isFactoryProvider, isValueProvider, isClassProvider, isExistingProvider, hasWrapperProvider, isWrapper, newHasWrapperProvider } from "../utils";
import { Token } from "../types";
import { Scope } from "../scope";
import { EMPTY_OBJECT, STATIC_CONTEXT } from "../constants";
import { useDefaultHooks } from "../wrappers";
import { Cacheable } from "../wrappers/cacheable";

import { NilInjector } from "./injector";
import { ProviderRecord } from "./provider";
import { InjectorResolver } from "./resolver";

export const InjectorMetadata = new class {
  /**
   * PROVIDERS
   */
  toRecord<T>(
    provider: Provider<T>,
    host: Injector,
  ): ProviderRecord {
    if (typeof provider === "function") {
      return this.typeProviderToRecord(provider, host);
    } else {
      return this.customProviderToRecord(provider.provide, provider, host);
    }
  }

  typeProviderToRecord<T>(
    provider: TypeProvider<T>,
    host: Injector,
  ): ProviderRecord {
    const provDef = this.getProviderDef(provider);
    const options = provDef.options || EMPTY_OBJECT as InjectableOptions<any>;

    if (
      'useWrapper' in options || 
      'useFactory' in options ||
      'useValue' in options ||
      'useExisting' in options ||
      'useClass' in options
    ) {
      // shallow copy provDef
      const customProvider = { ...options, useClass: provider } as PlainProvider;
      return this.customProviderToRecord(provider, customProvider, host);
    }

    const record = this.getRecord(provider, host);
    record.addDefinition(provDef.factory, this.getScopeShape(provDef.scope), undefined, undefined, options.annotations || EMPTY_OBJECT, provider.prototype);
    return record;
  }

  customProviderToRecord<T>(
    token: Token<T>,
    provider: PlainProvider<T>,
    host: Injector,
  ): ProviderRecord {
    const record = this.getRecord(token, host);
    let factory: FactoryDef = undefined,
      scope: ScopeShape = this.getScopeShape((provider as any).scope),
      annotations: Record<string | symbol, any> = provider.annotations || EMPTY_OBJECT,
      proto = undefined;

    if (isFactoryProvider(provider)) {
      const deps = this.convertDependencies(provider.inject || [], provider.useFactory);
      factory = (injector: Injector, session?: Session) => {
        return provider.useFactory(...InjectorResolver.injectDeps(deps, injector, session));
      }
    } else if (isValueProvider(provider)) {
      factory = () => provider.useValue;
    } else if (isExistingProvider(provider)) {
      const aliasProvider = provider.useExisting;
      let changed = false;
      factory = (injector: Injector, session?: Session) => {
        // change record from useExisting provider to record pointed by useExisting token
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
      scope = scope || this.getScopeShape(providerDef.scope);
      proto = classRef;
    }

    const constraint = provider.when;
    let wrapper = undefined;
    if (hasWrapperProvider(provider)) {
      wrapper = provider.useWrapper;

      // case with standalone `useWrapper`
      if (factory === undefined) {
        record.addWrapper(wrapper, constraint)
        return record;
      }
    }

    record.addDefinition(factory, scope, constraint, wrapper, annotations, proto);
    return record;
  }

  getRecord<T>(
    token: Token<T>,
    host: Injector,
  ): ProviderRecord {
    const records: Map<Token, ProviderRecord> = (host as any).records;
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
      record = new ProviderRecord(token, host);
      records.set(token, record);
    }
    return record;
  }

  getScopeShape(scope: ScopeType): ScopeShape {
    if (scope && (scope as ScopeShape).which === undefined) {
      scope = {
        which: scope as unknown as Scope,
        options: undefined,
      }
    }
    return scope as ScopeShape;
  }

  /**
   * COMPONENTS
   */
  toComponentRecord<T>(
    comp: Type<T>,
    host: Injector,
    useWrapper?: WrapperDef,
  ): ComponentRecord<T> {
    const def = this.getProviderDef(comp);
    useWrapper = useDefaultHooks(useWrapper);
    return {
      comp,
      host,
      factory: def.factory,
      scope: (def.scope || Scope.SINGLETON) as any,
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
    // FIX this
    // const ctx = scope.getContext(session, comp as any) || STATIC_CONTEXT;
    const ctx = STATIC_CONTEXT;
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
