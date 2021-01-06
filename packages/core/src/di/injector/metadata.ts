import { Injector } from "./injector";
import { injectableMixin } from "../decorators";
import { getProviderDef, createInjectionArg } from "../definitions";
import { 
  InjectionFlags, InjectionStatus,
  ProviderType, ModuleType,
} from "../enums";
import { 
  Type, Provider, TypeProvider, StaticClassProvider,
  InjectionRecord, RecordDefinition, ContextRecord, InjectorRecord, InjectorContextRecord,
  InjectionArgument,
  ProviderDef, InquirerDef, FactoryDef, InjectionOptions,
} from "../interfaces";
import { Context } from "../tokens";
import { Token } from "../types";
import { Scope } from "../scopes";
import { 
  isFactoryProvider, isValueProvider, isExistingProvider,
  resolveForwardRef, decorate
} from "../utils";
import { STATIC_CONTEXT, EMPTY_OBJ, SPECIAL_TOKENS } from "../constants";

import { resolver } from "./resolver";

export class InjectionMetadata {
  typeProviderToRecord<T>(
    token: Token<T>,
    provider: TypeProvider<T>,
    hostInjector: Injector,
  ): InjectionRecord<T> {
    const resolvedRef = resolveForwardRef(provider);
    const def = this.getProviderDef(provider);
    return this.makeRecord(
      token,
      hostInjector,
      def.factory,
      ProviderType.TYPE,
      def.scope,
      resolvedRef.prototype,
    );
  }

  customProviderToRecord<T>(
    token: Token<T>,
    provider: Provider<T>,
    hostInjector: Injector,
  ): InjectionRecord<T> {
    if (isFactoryProvider(provider)) {
      const record = this.makeRecord(token, hostInjector, undefined, ProviderType.FACTORY, provider.scope);
      record.factory = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
        const deps = this.convertFactoryDeps(provider.inject || []);
        record.factory = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
          return resolver.injectFactory(provider.useFactory as any, deps, injector, inquirer, sync);
        }
        return resolver.injectFactory(provider.useFactory as any, deps, injector, inquirer, sync);
      }
      return record;
    }
    
    if (isValueProvider(provider)) {
      let record = undefined;
      if ((record = (hostInjector as any).ownRecords.get(token)) === undefined) {
        record = this.makeRecord(token, hostInjector, undefined, ProviderType.VALUE);
      }
      const ctx = provider.ctx || STATIC_CONTEXT;
      const ctxRecord = this.makeContextRecord(ctx, provider.useValue, InjectionStatus.RESOLVED, record);
      record.values.set(ctx, ctxRecord);
      return record;
    } 

    // fix any type -> TS has a problem with FactoryDef returnType -> Promise<T> | T
    if (isExistingProvider(provider)) {
      const existingProvider = resolveForwardRef(provider.useExisting);
      if (Array.isArray(existingProvider)) {
        const record = this.makeRecord(token, hostInjector, undefined, ProviderType.EXISTING_MULTI);
        record.factory = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
          let args: Array<InjectionArgument> = [];
          for (let i = 0, l = existingProvider.length; i < l; i++) {
            const prov = existingProvider[i];
            if (prov.token) {
              const flags = prov.hasOwnProperty('default') ? InjectionFlags.OPTIONAL : InjectionFlags.DEFAULT;
              args.push({ token: prov.token, options: { ctx: prov.ctx, flags, default: prov.default } });
            } else {
              args.push({ token: prov, options: EMPTY_OBJ });
            }
          }
          record.factory = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
            return resolver.injectDeps(args, injector, inquirer, sync) as any;
          }
          return resolver.injectDeps(args, injector, inquirer, sync) as any;
        }
        return record;
      } else {
        const record = this.makeRecord(token, hostInjector, undefined, ProviderType.EXISTING);
        record.factory =  (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
          const flags = provider.hasOwnProperty('default') ? InjectionFlags.OPTIONAL : InjectionFlags.DEFAULT;
          return resolver.inject(existingProvider, injector, { ctx: provider.ctx, flags, default: provider.default }, inquirer, sync) as any;
        }
        return record;
      }
    }

    // useClass case
    const clazz = provider as StaticClassProvider;
    const classRef = resolveForwardRef(clazz.useClass || clazz.provide) as Type;
    if (clazz.inject) {
      const def = this.getProviderDef(classRef, false);
      const type = clazz.useClass ? ProviderType.STATIC_CLASS : ProviderType.CONSTRUCTOR;
      const record = this.makeRecord(token, hostInjector, undefined, type, clazz.scope, classRef.prototype);
      if (def === undefined) {
        record.factory = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
          const deps = this.convertCtorDeps(clazz.inject, classRef);
          record.factory = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
            return resolver.injectClass(classRef, deps, injector, inquirer, sync);
          }
          return resolver.injectClass(classRef, deps, injector, inquirer, sync);
        }
      } else {
        // fix passing deps
        const deps = this.convertCtorDeps(clazz.inject, classRef);
        record.factory = resolver.providerFactory(classRef, def, deps);
      }
      return record;
    }
    return this.makeRecord(token, hostInjector, this.getFactoryDef(classRef), ProviderType.CLASS, clazz.scope, classRef.prototype);
  }

  public factoryToRecord<T>(
    token: Token<T>,
    method: Function,
    def: ProviderDef<T>,
    hostInjector: Injector,
  ): InjectionRecord<T> {
    const record = this.makeRecord(token, hostInjector, undefined, ProviderType.FACTORY, def.scope);
    record.factory = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
      return resolver.injectFactory(method as any, def.args.ctor, injector, inquirer, sync);
    }
    return record;
  }

  private makeRecord<T>(
    token: Token<T>,
    hostInjector: Injector,
    factory: FactoryDef<T>| undefined, 
    type: ProviderType = ProviderType.TYPE,
    scope: Scope = Scope.DEFAULT,
    prototype: Type<T> | undefined =  undefined,
  ): InjectionRecord<T> {
    return {
      token,
      hostInjector,
      defs: new Map<Token, RecordDefinition>(),
      factory,
      values: new Map<Context, ContextRecord>(),
      weakValues: new WeakMap<Context, ContextRecord>(),
      type,
      scope,
      prototype,
      multi: undefined,
      flags: 0,
    };
  }

  public makeMultiRecord<T>(
    token: Token<T>,
    hostInjector: Injector,
    scope: Scope = undefined,
  ): InjectionRecord<T> {
    const record = this.makeRecord(token, hostInjector, undefined, ProviderType.MULTI, scope);
    // inject multi provider arrays by reference for future processing
    // cast to any, because single provider in `multi` array is treated as a token in `inject` method   
    record.multi = [];
    record.factory = (injector: Injector, inquirer: InquirerDef, sync?: boolean) => {
      return resolver.injectDeps(this.convertFactoryDeps(record.multi as any), injector, inquirer, sync) as any;
    }
    return record;
  }

  public getContextRecord<T>(
    record: InjectionRecord<T>, 
    options: InjectionOptions,
    scope: Scope,
    inquirer?: InquirerDef,
  ): ContextRecord<T> {
    const ctx = scope.getContext(options, record, inquirer);
    let ctxRecord = record.values.get(ctx);
    if (ctxRecord === undefined) {
      ctxRecord = this.makeContextRecord(ctx, undefined, InjectionStatus.UNKNOWN, record);
      if (scope.toCache(options, record, inquirer)) {
        ctxRecord.status |= InjectionStatus.CACHED;
        record.values.set(ctx, ctxRecord);
      } else {
        record.weakValues.set(ctx, ctxRecord);
      }
    }
    return ctxRecord;
  }

  public makeContextRecord<T>(
    ctx: Context,
    value: T | undefined,
    status?: InjectionStatus,
    record?: InjectionRecord<T>,
  ): ContextRecord<T> {
    return {
      ctx,
      value,
      status: status || InjectionStatus.UNKNOWN,
      record,
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
