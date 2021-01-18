import { Injector } from "./injector";
import { constraintNoop } from "../constraints";
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
  ProviderDef, InquirerDef, FactoryDef, InjectionOptions, WhenFunction,
} from "../interfaces";
import { InjectionToken, Context } from "../tokens";
import { Token } from "../types";
import { Scope } from "../scopes";
import { 
  isFactoryProvider, isValueProvider, isExistingProvider,
  resolveForwardRef, decorate
} from "../utils";
import { STATIC_CONTEXT, SPECIAL_TOKENS } from "../constants";

import { resolver } from "./resolver";

export class InjectionMetadata {
  typeProviderToRecord<T>(
    provider: TypeProvider<T>,
    hostInjector: Injector,
  ): InjectionRecord<T> {
    const classRef = resolveForwardRef(provider);
    const provDef = this.getProviderDef(classRef);
    const record = this.getRecord(classRef, hostInjector);
    record.defs[0] = this.makeDefinition(classRef, provDef.factory, undefined, ProviderType.TYPE, record, provDef.scope, classRef.prototype);
    return record;
  }

  // customProviderToRecord<T>(
  //   token: Token<T>,
  //   provider: Provider<T>,
  //   hostInjector: Injector,
  // ): void {
  //   const records: Map<Token, InjectionRecord> = (hostInjector as any).ownRecords;
  //   const resolvedRef = resolveForwardRef(token);
  //   let record = records.get(resolvedRef);
  //   if (record === undefined) {
  //     record = this.makeRecord(resolvedRef, hostInjector);
  //     records.set(resolvedRef, record);
  //   }

  //   if (isFactoryProvider(provider)) {
  //     const deps = this.convertFactoryDeps(provider.inject || []);
  //     const factory = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
  //       return resolver.injectFactory(provider.useFactory as any, deps, injector, inquirer, sync);
  //     }
  //     record.defs.set(provider.def || "", this.makeDefinition(factory, ProviderType.FACTORY, record, provider.scope));
  //     return;
  //   }
    
  //   if (isValueProvider(provider)) {
  //     const ctx = provider.ctx || STATIC_CONTEXT;
  //     const defRecord = this.makeDefinition(undefined, ProviderType.VALUE, record);
  //     const ctxRecord = this.makeContextRecord(ctx, provider.useValue, InjectionStatus.RESOLVED, defRecord);
  //     defRecord.values.set(ctx, ctxRecord);
  //     return;
  //   } 

  //   if (isExistingProvider(provider)) {
  //     const existingProvider = resolveForwardRef(provider.useExisting);
  //     const factory = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
  //       return resolver.inject(existingProvider, injector, undefined, inquirer, sync) as any;
  //     }
  //     record.defs.set(provider.def || "", this.makeDefinition(factory, ProviderType.EXISTING, record));
  //     return;
  //   }

  //   const clazz = provider as StaticClassProvider;
  //   const classRef = resolveForwardRef(clazz.useClass || clazz.provide) as Type;
  //   if (clazz.inject) {
  //     const def = this.getProviderDef(classRef, false);
  //     const type = clazz.useClass ? ProviderType.STATIC_CLASS : ProviderType.CONSTRUCTOR;
  //     const deps = this.convertCtorDeps(clazz.inject, classRef);
  //     let factory = undefined;
  //     if (def === undefined) {
  //       factory = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
  //         return resolver.injectClass(classRef, deps, injector, inquirer, sync);
  //       }
  //     } else {
  //       factory = resolver.providerFactory(classRef, def, deps);
  //     }
  //     record.defs.set((provider as any).def || "", this.makeDefinition(factory, type, record, clazz.scope, classRef.prototype));
  //   }
  //   record.defs.set((provider as any).def || "", this.makeDefinition(this.getFactoryDef(classRef), ProviderType.CLASS, record, clazz.scope, classRef.prototype));
  // }

  customProviderToRecord<T>(
    token: Token<T>,
    provider: CustomProvider<T>,
    hostInjector: Injector,
  ): InjectionRecord<T> {
    token = resolveForwardRef(token);
    if (token instanceof InjectionToken && token.isMulti()) {
      // dodaj tutaj whena jeśli provider go nie ma, w ten sposób unikamy podwójnej definicji dla multi providera
    }
    const record = this.getRecord(token, hostInjector);

    const [factory, type, proto] = this.retrieveMetadata(provider),
      when = provider.when,
      def = this.makeDefinition(provider, factory as any, when, type, record, (provider as any).scope, proto);
    if (typeof when === "function") {
      record.defs.push(def);
    } else {
      record.defaultDef = def;
    }

    return record;
  }

  // multiProviderToRecord<T>(
  //   token: Token<T>,
  //   provider: CustomProvider<T>,
  //   hostInjector: Injector,
  // ): InjectionRecord<T> {

  // }

  public retrieveMetadata<T>(
    provider: CustomProvider<T>,
  ): [Function, ProviderType, any] {
    if (isFactoryProvider(provider)) {
      const deps = this.convertFactoryDeps(provider.inject || []);
      const factory = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
        return resolver.injectFactory(provider.useFactory as any, deps, injector, inquirer, sync);
      }
      return [factory, ProviderType.FACTORY, undefined];
    } else if (isValueProvider(provider)) {
      const factory = () => provider.useValue;
      return [factory, ProviderType.VALUE, undefined];
    } else if (isExistingProvider(provider)) {
      const existingProvider = resolveForwardRef(provider.useExisting);
      const factory = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
        return resolver.inject(existingProvider, inquirer.options, injector, inquirer, sync) as any;
      }
      return [factory, ProviderType.EXISTING, undefined];
    }
    const clazz = provider as StaticClassProvider;
    const classRef = resolveForwardRef(clazz.useClass || clazz.provide) as Type;
    if (clazz.inject) {
      const def = this.getProviderDef(classRef, false);
      const deps = this.convertCtorDeps(clazz.inject, classRef);
      let factory = undefined, type = undefined;
      if (def === undefined) {
        factory = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
          return resolver.injectClass(classRef, deps, injector, inquirer, sync);
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
    hostInjector: Injector,
  ): InjectionRecord {
    const records: Map<Token, InjectionRecord> = (hostInjector as any).ownRecords;
    let record = records.get(token);
    if (record === undefined) {
      record = this.makeRecord(token, hostInjector);
      records.set(token, record);
    }
    return record;
  }

  public makeRecord<T>(
    token: Token<T>,
    hostInjector: Injector,
  ): InjectionRecord<T> {
    return {
      token,
      hostInjector,
      defaultDef: undefined,
      defs: [],
    }
  }

  private makeDefinition(
    provider: Provider,
    factory: FactoryDef,
    when: WhenFunction, 
    type: ProviderType,
    record: InjectionRecord,
    scope?: Scope,
    prototype?: Type,
  ): RecordDefinition {
    return {
      factory,
      when: when || constraintNoop,
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

  // public makeMultiRecord<T>(
  //   token: Token<T>,
  //   hostInjector: Injector,
  //   scope: Scope = undefined,
  // ): InjectionRecord<T> {
  //   const records: Map<Token, InjectionRecord> = (hostInjector as any).ownRecords;
  //   const resolvedRef = resolveForwardRef(token);
  //   let record = records.get(resolvedRef);
  //   if (record === undefined) {
  //     record = this.makeRecord(resolvedRef, hostInjector);
  //     records.set(resolvedRef, record);
  //   }

  //   // TODO: Fix multi providers
  //   const def = this.makeDefinition(undefined, undefined, undefined, ProviderType.MULTI, record, scope);
  //   // inject multi provider arrays by reference for future processing
  //   // cast to any, because single provider in `multi` array is treated as a token in `inject` method   
  //   def.multi = [];
  //   def.factory = (injector: Injector, inquirer: InquirerDef, sync?: boolean) => {
  //     return resolver.injectDeps(this.convertFactoryDeps(def.multi as any), injector, inquirer, sync) as any;
  //   }
  //   return record;
  // }

  public getContextRecord<T>(
    def: RecordDefinition<T>, 
    options: InjectionOptions,
    scope: Scope,
    inquirer?: InquirerDef,
  ): ContextRecord<T> {
    const ctx = scope.getContext(options, def, inquirer);
    let ctxRecord = def.values.get(ctx);
    if (ctxRecord === undefined) {
      ctxRecord = this.makeContextRecord(ctx, undefined, InjectionStatus.UNKNOWN, def);
      if (scope.toCache(options, def, inquirer)) {
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
        if (SPECIAL_TOKENS.includes(arg as any)) {
          a.options.flags |= InjectionFlags.SPECIAL_TOKEN;
        }
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
        if (SPECIAL_TOKENS.includes(arg as any)) {
          a.options.flags |= InjectionFlags.SPECIAL_TOKEN;
        }
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
}

export const metadata = new InjectionMetadata();
