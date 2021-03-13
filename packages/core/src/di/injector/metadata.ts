import { Injector } from "./injector";
import { constraintNoop } from "../bindings";
import { injectableMixin } from "../decorators";
import { getProviderDef, createInjectionArg } from "../definitions";
import { 
  InjectionFlags, InjectionStatus,
  ProviderType, ModuleType,
} from "../enums";
import { 
  Type, Provider, CustomProvider, TypeProvider, StaticClassProvider,
  InjectionRecord, RecordDefinition, ContextRecord, InjectorRecord, InjectorContextRecord,
  InjectionArgument,
  ProviderDef, InjectionSession, FactoryDef, InjectionOptions, ConstraintFunction,
} from "../interfaces";
import { InjectionToken, Context } from "../tokens";
import { Token } from "../types";
import { Scope } from "../scopes";
import { 
  isFactoryProvider, isValueProvider, isExistingProvider, isCustomProvider,
  resolveForwardRef, decorate
} from "../utils";
import { STATIC_CONTEXT } from "../constants";

import { resolver } from "./resolver";
import { getNilInjector } from "./factories";

export class InjectionMetadata {
  toRecord<T>(
    provider: Provider<T>,
    hostInjector: Injector,
  ): InjectionRecord<T> {
    if (typeof provider === "function") {
      return this.typeProviderToRecord(provider, hostInjector);
    } else {
      return this.customProviderToRecord(provider.provide, provider, hostInjector);
    }
  }

  typeProviderToRecord<T>(
    provider: TypeProvider<T>,
    hostInjector: Injector,
  ): InjectionRecord<T> {
    const classRef = resolveForwardRef(provider);
    const provDef = this.getProviderDef(classRef);
    const record = this.getRecord(classRef, classRef, hostInjector);
    record.defaultDef = this.makeDefinition(classRef, record, provDef.scope, provDef.factory, undefined, ProviderType.TYPE, classRef.prototype);
    return record;
  }

  customProviderToRecord<T>(
    token: Token<T>,
    provider: CustomProvider<T>,
    hostInjector: Injector,
  ): InjectionRecord<T> {
    token = resolveForwardRef(token);
    let record = this.getRecord(token, provider, hostInjector);
    const def = this.makeDefinition(provider, record, (provider as any).scope);
    
    let constraint = provider.when;
    if (record.isMulti === true) {
      const itemRecord = this.customProviderToRecord(provider as any, provider, hostInjector);
      // add scope from provider
      record.defs.push(this.makeDefinition(undefined, itemRecord, undefined, undefined, constraint || constraintNoop, undefined));
      constraint = undefined;
      record = itemRecord;
    }
    const [factory, type, proto] = this.retrieveMetadata(provider, record, def);
    def.record = record;
    def.factory = factory as any;
    def.constraint = constraint;
    def.type = type;
    def.prototype = proto;

    if (typeof constraint === "function") {
      record.defs.push(def);
    } else {
      record.defaultDef = def;
    }

    return record;
  }

  public retrieveMetadata<T>(
    provider: CustomProvider<T>,
    record: InjectionRecord,
    def: RecordDefinition,
  ): [Function, ProviderType, any] {
    if (isFactoryProvider(provider)) {
      const deps = this.convertFactoryDeps(provider.inject || []);
      const factory = (injector: Injector, session?: InjectionSession, sync?: boolean) => {
        return resolver.injectFactory(provider.useFactory as any, deps, injector, session, sync);
      }
      return [factory, ProviderType.FACTORY, undefined];
    } else if (isValueProvider(provider)) {
      const factory = () => provider.useValue;
      return [factory, ProviderType.VALUE, undefined];
    } else if (isExistingProvider(provider)) {
      const existingProvider = resolveForwardRef(provider.useExisting);
      const factory = (injector: Injector, session?: InjectionSession, sync?: boolean) => {
        const deepRecord = metadata.getDeepRecord(existingProvider, injector, false);
        if (deepRecord !== undefined) {
          (injector as any).ownRecords.set(provider.provide, deepRecord);
        }
        return resolver.inject(provider.provide, session.options, injector, session.parent, sync);
      }
      return [factory, ProviderType.EXISTING, undefined];
    } else if (isCustomProvider(provider)) {
      return [provider.useCustom(record, def), ProviderType.CUSTOM, undefined];
    }
    const clazz = provider as StaticClassProvider;
    const classRef = resolveForwardRef(clazz.useClass || clazz.provide) as Type;
    if (clazz.inject) {
      const def = this.getProviderDef(classRef, false);
      const deps = this.convertCtorDeps(clazz.inject, classRef);
      let factory = undefined, type = undefined;
      if (def === undefined) {
        factory = (injector: Injector, session?: InjectionSession, sync?: boolean) => {
          return resolver.injectClass(classRef, deps, injector, session, sync);
        };
        type = ProviderType.STATIC_CLASS;
      } else {
        factory = resolver.providerFactory(classRef, def, deps);
        type = ProviderType.CONSTRUCTOR;
      }
      return [factory, type, classRef.prototype];
    }
    return [this.getFactoryDef(classRef), ProviderType.CLASS, classRef.prototype];
  }

  private getRecord<T>(
    token: Token<T>,
    provider: Provider,
    hostInjector: Injector,
  ): InjectionRecord {
    const records: Map<Token, InjectionRecord> = (hostInjector as any).ownRecords;
    let record = records.get(token);
    if (record === undefined) {
      if (token instanceof InjectionToken && token.isMulti()) {
        record = this.makeMultiRecord(token, provider, hostInjector);
      } else {
        record = this.makeRecord(token, hostInjector, false);
      }
      records.set(token, record);
    }
    return record;
  }

  public makeRecord<T>(
    token: Token<T>,
    hostInjector: Injector,
    isMulti: boolean,
  ): InjectionRecord<T> {
    return {
      token,
      hostInjector,
      defaultDef: undefined,
      defs: [],
      isMulti,
    }
  }

  public makeMultiRecord<T>(
    token: InjectionToken,
    provider: Provider,
    hostInjector: Injector,
  ): InjectionRecord<T> {
    const def = this.getProviderDef(token);
    const record = this.makeRecord(token, hostInjector, true);
    const factory = (injector: Injector, session: InjectionSession, sync?: boolean) => {
      const items = record.defs.filter(def => def.constraint(session.options, session)).map(def => def.record.token);
      return resolver.injectDeps(this.convertFactoryDeps(items), injector, session, sync) as any;
    }
    record.defaultDef = this.makeDefinition(provider, record, def.scope, factory as any, undefined, ProviderType.MULTI);
    return record;
  }

  private makeDefinition(
    provider: Provider,
    record: InjectionRecord,
    scope: Scope | undefined,
    factory?: FactoryDef,
    constraint?: ConstraintFunction, 
    type?: ProviderType,
    prototype?: Type,
  ): RecordDefinition {
    return {
      factory,
      constraint,
      values: new Map<Context, ContextRecord>(),
      weakValues: new WeakMap<Context, ContextRecord>(),
      type,
      record,
      scope: scope || Scope.DEFAULT,
      prototype: prototype || undefined,
      flags: 0,
      original: provider,
    };
  }

  public getContextRecord<T>(
    def: RecordDefinition<T>, 
    options: InjectionOptions,
    scope: Scope,
    session?: InjectionSession,
  ): ContextRecord<T> {
    const ctx = scope.getContext(options, def, session);
    let ctxRecord = def.values.get(ctx) || def.weakValues.get(ctx);
    if (ctxRecord === undefined) {
      ctxRecord = this.makeContextRecord(ctx, undefined, InjectionStatus.UNKNOWN, def);
      if (scope.toCache(options, def, session) === true) {
        ctxRecord.status |= InjectionStatus.CACHED;
        def.values.set(ctx, ctxRecord);
      } else {
        def.weakValues.set(ctx, ctxRecord);
      }
    }
    return ctxRecord;
  }

  public makeContextRecord<T>(
    ctx: Context,
    value: T | undefined,
    status?: InjectionStatus,
    def?: RecordDefinition<T>,
  ): ContextRecord<T> {
    return {
      ctx,
      value,
      status: status || InjectionStatus.UNKNOWN,
      def,
    };
  }

  public makeInjectorRecord<T, I>(
    module: Type<T>,
  ): InjectorRecord<T, I> {
    const values = new Map<Context, InjectorContextRecord<I>>();
    return {
      module,
      values,
    };
  }

  public makeInjectorContextRecord<I>(
    injector: I,
    ctx: Context = STATIC_CONTEXT,
    type: ModuleType,
  ): InjectorContextRecord<I> {
    return {
      injector,
      ctx,
      type,
    };
  }

  // temporary solution
  public convertCtorDeps(inject: Array<Token | Array<ParameterDecorator>>, target?: Object): Array<InjectionArgument> {
    const t = class {};
    const args: Array<InjectionArgument> = [];
    for (let i = 0, l = inject.length; i < l; i++) {
      const arg = inject[i];
      if (Array.isArray(arg)) {
        decorate(arg, t, i);
        const def = this.getProviderDef(t as any);
        const c = def.args.ctor[i];
        c.options.target = target;
        args.push(c);
      } else {
        const a = createInjectionArg(InjectionFlags.CONSTRUCTOR_PARAMETER, target, undefined, i);
        a.token = arg;
        args.push(a);
      }
    }
    return args;
  }

  // temporary solution
  public convertFactoryDeps(inject: Array<Token | Array<ParameterDecorator>>): Array<InjectionArgument> {
    const t = class {};
    const args: Array<InjectionArgument> = [];
    for (let i = 0, l = inject.length; i < l; i++) {
      const arg = inject[i];
      if (Array.isArray(arg)) {
        decorate(arg, t, i);
        const def = this.getProviderDef(t as any);
        const c = def.args.ctor[i];
        c.options.flags &= ~InjectionFlags.CONSTRUCTOR_PARAMETER;
        c.options.flags |= InjectionFlags.FACTORY;
        args.push(c);
      } else {
        const a = createInjectionArg(InjectionFlags.FACTORY, undefined, undefined, i);
        a.token = arg;
        args.push(a);
      }
    }
    return args;
  }

  public getProviderDef<T>(token: Token<T>, _throw?: boolean): ProviderDef {
    let providerDef = getProviderDef(token);
    if (!providerDef) {
      // using injectableMixin() as fallback for decorated classes with different decorator than @Injectable() or @Module()
      // collect only constructor params
      typeof token === "function" && injectableMixin(token as Type);
      if ((providerDef = getProviderDef(token)) === undefined && (_throw === undefined || _throw === true)) {
        throw new Error('Cannot get provider def');
      }
    }
    return providerDef;
  }

  public getFactoryDef<T>(token: Token<T>): FactoryDef<T> {
    const providerDef = this.getProviderDef(token);
    if (providerDef.factory === undefined) {
      throw new Error('Cannot get factory def')
    }
    return providerDef.factory;
  }

  public getDeepRecord(token: Token, injector: Injector, skipSelf: boolean = true): InjectionRecord | undefined {
    let record: InjectionRecord = skipSelf ? undefined : (injector as any).getRecord(token); 
    if (record) {
      return record;
    }

    const nilInjector = getNilInjector();
    let parentInjector = injector.getParentInjector();
    while (parentInjector !== nilInjector) {
      if (record = (parentInjector as any).getRecord(token)) {
        return record;
      }
      parentInjector = parentInjector.getParentInjector();
    }
    return record;
  }
}

export const metadata = new InjectionMetadata();
