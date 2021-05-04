import { Context, Injector } from ".";
import { getProviderDef } from "../decorators";
import { 
  Provider, TypeProvider, CustomProvider,
  InstanceRecord, DefinitionRecord, ProviderRecord,
  ProviderDef, FactoryDef, Type,
  InjectionOptions, InjectionSession, ConstraintDef, InjectionMetadata,
} from "../interfaces";
import { isFactoryProvider, isValueProvider, isClassProvider, isWrapperProvider } from "../utils";
import { InjectionStatus } from "../enums";
import { Token } from "../types";
import { Scope } from "../scope";
import { STATIC_CONTEXT, NOOP_CONSTRAINT } from "../constants";

import { InjectorResolver } from "./resolver";

export const InjectorMetadata = new class {
  toRecord<T>(
    provider: Provider<T>,
    hostInjector: Injector,
  ): ProviderRecord<T> {
    if (typeof provider === "function") {
      return this.typeProviderToRecord(provider, hostInjector);
    } else {
      return this.customProviderToRecord(provider.provide, provider, hostInjector);
    }
  }

  typeProviderToRecord<T>(
    provider: TypeProvider<T>,
    hostInjector: Injector,
  ): ProviderRecord<T> {
    const provDef = this.getProviderDef(provider);
    const record = this.getRecord(provider, hostInjector);
    record.defaultDef = this.createDefinitionRecord(record, provDef.factory, provDef.scope, provider.prototype);
    return record;
  }

  customProviderToRecord<T>(
    token: Token<T>,
    provider: CustomProvider<T>,
    hostInjector: Injector,
  ) {
    const record = this.getRecord(token, hostInjector);
    let factory: FactoryDef = undefined;
    let prototype = undefined;

    if (isFactoryProvider(provider)) {
      factory = () => (injector: Injector, session?: InjectionSession) => {
        return provider.useFactory(...InjectorResolver.injectDeps(provider.inject || [], injector, session));
      }
    } else if (isValueProvider(provider)) {
      factory = () => provider.useValue;
    } else if (isClassProvider(provider)) {
      const classRef = provider.useClass;
      const def = this.getProviderDef(classRef, true);
      factory = InjectorResolver.providerFactory(classRef, def);
      prototype = classRef;
    } else if (isWrapperProvider(provider)) {
      record.wrappers.push({
        wrapper: provider.useWrapper,
        constraint: provider.when || NOOP_CONSTRAINT,
      });
      return record;
    } else {
      factory = (injector: Injector, session?: InjectionSession) => {
        // const deepRecord = metadata.getDeepRecord(existing, injector, false);
        // if (deepRecord !== undefined) {
        //   (injector as any).ownRecords.set(provider.provide, deepRecord);
        // }
        return injector.get(provider.useExisting, session.options, session.parent);
      }
    }

    const constraint = provider.when;
    const def = this.createDefinitionRecord(record, factory, (provider as any).scope, constraint, prototype);
    if (constraint !== undefined) {
      record.defs.push(def);
    } else {
      record.defaultDef = def;
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
    prototype?: Type,
  ): DefinitionRecord {
    return {
      record,
      factory,
      scope: scope || Scope.DEFAULT,
      values: new Map<Context, InstanceRecord>(),
      constraint,
      prototype: prototype || undefined,
    };
  }

  createInstanceRecord<T>(
    ctx: Context,
    value: T | undefined,
    status?: InjectionStatus,
    def?: DefinitionRecord<T>,
  ): InstanceRecord<T> {
    return {
      ctx,
      value,
      status: status || InjectionStatus.UNKNOWN,
      def,
    };
  }

  createSession<T>(
    instance: InstanceRecord<T>,
    options: InjectionOptions,
    parent: InjectionSession,
    meta?: InjectionMetadata<T>,
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
    const ctx = scope.getContext(def, session) || STATIC_CONTEXT;
    let instance = def.values.get(ctx);
    if (instance === undefined) {
      instance = this.createInstanceRecord(ctx, undefined, InjectionStatus.UNKNOWN, def);
      def.values.set(ctx, instance);
      // if (scope.toCache(options, def, session) === true) {
      //   ctxRecord.status |= InjectionStatus.CACHED;
      //   def.values.set(ctx, ctxRecord);
      // }
    }
    session.instance = instance;
    return instance;
  }

  getProviderDef<T>(token: Token<T>, _throw?: boolean): ProviderDef {
    let providerDef = getProviderDef(token);
    if (!providerDef) {
      throw new Error('Cannot get provider def');

      // // using injectableMixin() as fallback for decorated classes with different decorator than @Injectable() or @Module()
      // // collect only constructor params
      // typeof token === "function" && injectableMixin(token as Type);
      // if ((providerDef = getProviderDef(token)) === undefined && (_throw === undefined || _throw === true)) {
      //   throw new Error('Cannot get provider def');
      // }
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
}
