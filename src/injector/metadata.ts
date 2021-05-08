import { Context, Injector } from ".";
import { createInjectionArg, getProviderDef, injectableMixin } from "../decorators";
import { 
  Provider, TypeProvider, CustomProvider,
  InstanceRecord, DefinitionRecord, ProviderRecord,
  ProviderDef, FactoryDef, Type,
  InjectionOptions, InjectionSession, ConstraintDef, InjectionMetadata, WrapperDef, InjectionArgument,
} from "../interfaces";
import { isFactoryProvider, isValueProvider, isClassProvider, isExistingProvider, hasWrapperProvider } from "../utils";
import { InjectionStatus } from "../enums";
import { Token } from "../types";
import { Scope } from "../scope";
import { STATIC_CONTEXT, NOOP_CONSTRAINT } from "../constants";

import { InjectorResolver } from "./resolver";
import { NilInjector } from "./injector";

export const InjectorMetadata = new class {
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
    const record = this.getRecord(provider, hostInjector);
    record.defaultDef = this.createDefinitionRecord(record, provDef.factory, provDef.scope, provider.prototype);
    return record;
  }

  customProviderToRecord<T>(
    token: Token<T>,
    provider: CustomProvider<T>,
    hostInjector: Injector,
  ): ProviderRecord {
    const record = this.getRecord(token, hostInjector);
    let factory: FactoryDef = undefined,
      scope: Scope = (provider as any).scope,
      proto = undefined;

    if (isFactoryProvider(provider)) {
      const deps = this.convertDependencies(provider.inject || [], provider.useFactory);
      factory = (injector: Injector, session?: InjectionSession) => {
        return provider.useFactory(...InjectorResolver.injectDeps(deps, injector, session));
      }
    } else if (isValueProvider(provider)) {
      factory = () => provider.useValue;
      scope = Scope.SINGLETON;
    } else if (isClassProvider(provider)) {
      const classRef = provider.useClass;
      const providerDef = this.getProviderDef(classRef, true);
      factory = InjectorResolver.providerFactory(classRef, providerDef);
      proto = classRef;
    } else if (isExistingProvider(provider)) {
      const aliasProvider = provider.useExisting;
      let changed = false;
      factory = (injector: Injector, session?: InjectionSession) => {
        // save reference of record of existing provider to record created for useExisting
        // in other words change record from useExisting provider to record pointed by useExisting token
        if (changed === false) {
          const deepRecord = this.retrieveDeepRecord(aliasProvider, injector);
          if (deepRecord !== undefined) {
            (injector as any).records.set(provider.provide, deepRecord);
            changed = true;
          }
        }
        return injector.get(aliasProvider, session.options, session);
      }
    }

    const constraint = provider.when;
    let wrapper = undefined;
    if (hasWrapperProvider(provider)) {
      wrapper = provider.useWrapper;

      // case with standalone `useWrapper`
      if (factory === undefined) {
        record.wrappers.push({
          wrapper: wrapper,
          constraint: constraint || NOOP_CONSTRAINT,
        });
        return record;
      }
    }

    const def = this.createDefinitionRecord(record, factory, (provider as any).scope, constraint, wrapper, proto);
    if (constraint === undefined) {
      record.defaultDef = def;
    } else {
      record.defs.push(def);  
    }

    return record;
  }

  createProviderRecord<T>(
    token: Token<T>,
    hostInjector: Injector,
  ): ProviderRecord<T> {
    return {
      token,
      hostInjector,
      defaultDef: undefined,
      defs: [],
      wrappers: [],
    }
  }

  createDefinitionRecord(
    record: ProviderRecord,
    factory?: FactoryDef,
    scope?: Scope,
    constraint?: ConstraintDef,
    wrapper?: WrapperDef,
    proto?: Type,
  ): DefinitionRecord {
    return {
      record,
      factory,
      scope: scope || Scope.DEFAULT,
      values: new Map<Context, InstanceRecord>(),
      constraint,
      wrapper,
      proto: proto || undefined,
    };
  }

  createInstanceRecord<T>(
    ctx: Context,
    value: T | undefined,
    def?: DefinitionRecord<T>,
  ): InstanceRecord<T> {
    return {
      ctx,
      value,
      def,
      status: InjectionStatus.UNKNOWN,
    };
  }

  createSession<T>(
    instance: InstanceRecord<T>,
    options: InjectionOptions,
    parent: InjectionSession,
    meta?: InjectionMetadata,
  ): InjectionSession<T> {
    return {
      instance,
      options,
      meta,
      parent,
    };
  }

  getRecord<T>(
    token: Token<T>,
    hostInjector: Injector,
  ): ProviderRecord {
    const records: Map<Token, ProviderRecord> = (hostInjector as any).records;
    let record = records.get(token);
    if (record === undefined) {
      record = this.createProviderRecord(token, hostInjector);
      records.set(token, record);
    }
    return record;
  }

  getInstanceRecord<T>(
    def: DefinitionRecord<T>, 
    scope: Scope,
    session?: InjectionSession,
  ): InstanceRecord<T> {
    // console.log(scope)
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

    // console.log(ctx, def.record.token)
    session.instance = instance;
    return instance;
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
      if (dep.hasOwnProperty('$$nextWrapper')) {
        converted.push(createInjectionArg(undefined, dep as WrapperDef, undefined, undefined, i, factory));
      } else {
        converted.push(createInjectionArg(dep as any, undefined, undefined, undefined, i, factory));
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
