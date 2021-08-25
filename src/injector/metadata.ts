import { Context, Session, Injector } from ".";
import { createInjectionArg, getProviderDef, injectableMixin } from "../decorators";
import { 
  Provider, TypeProvider,
  ProviderDef, FactoryDef, Type,
  InjectionOptions, InjectionArgument, ComponentRecord, ComponentInstanceRecord, PlainProvider, InjectableOptions, ScopeShape, ScopeType,
} from "../interfaces";
import { isFactoryProvider, isValueProvider, isClassProvider, isExistingProvider, hasWrapperProvider, isWrapper } from "../utils";
import { Token } from "../types";
import { Scope } from "../scope";
import { EMPTY_ARRAY, EMPTY_OBJECT, STATIC_CONTEXT } from "../constants";

import { ProviderRecord } from "./provider";
import { InjectorResolver } from "./resolver";

import { copyWrappers, Wrapper } from "../utils/wrappers";
import { Cache } from "../wrappers/cache";
import { UseExisting } from "../wrappers/internal";

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
      'useFactory' in options ||
      'useValue' in options ||
      'useExisting' in options ||
      'useClass' in options
    ) {
      // shallow copy provDef
      const customProvider = { ...options as any, useClass: (options as any).useClass || provider } as PlainProvider;
      return this.customProviderToRecord(provider, customProvider, host);
    }

    const record = this.getRecord(provider, host);
    record.addDefinition(provDef.factory, this.getScopeShape(options.scope), undefined, options.useWrapper, options.annotations || EMPTY_OBJECT, provider.prototype);
    return record;
  }

  customProviderToRecord<T>(
    token: Token<T>,
    provider: PlainProvider<T>,
    host: Injector,
  ): ProviderRecord {
    const record = this.getRecord(token, host);
    const constraint = provider.when;
    let factory: FactoryDef = undefined,
      wrapper: Wrapper = undefined,
      scope: ScopeShape = this.getScopeShape((provider as any).scope),
      annotations: Record<string | symbol, any> = provider.annotations || EMPTY_OBJECT,
      proto = undefined;

    if (hasWrapperProvider(provider)) {
      wrapper = provider.useWrapper;
    }

    if (isFactoryProvider(provider)) {
      factory = InjectorResolver.createFactory(provider.useFactory, provider.inject || EMPTY_ARRAY, { cache: true });
    } else if (isValueProvider(provider)) {
      factory = () => provider.useValue;
    } else if (isExistingProvider(provider)) {
      const aliasProvider = provider.useExisting;
      // copy wrapper and add to the end the new one 
      if (wrapper) {
        wrapper = copyWrappers(wrapper);
        while (wrapper.next) {
          wrapper = wrapper.next;
        }
        wrapper.next = UseExisting(aliasProvider);
        wrapper.next.prev = wrapper.next;
      } else {
        wrapper = UseExisting(aliasProvider);
      }
      factory = () => {};
    } else if (isClassProvider(provider)) {
      const classRef = provider.useClass;
      const providerDef = this.getProviderDef(classRef, true);
      factory = InjectorResolver.createProviderFactory(classRef, providerDef);
      proto = classRef;

      // override scope if can be overrided
      const targetScope = this.getScopeShape(providerDef.options?.scope);
      if (targetScope && targetScope.kind.canBeOverrided() === false) {
        scope = targetScope;
      }
    }

    // case with standalone `useWrapper`
    if (factory === undefined && wrapper !== undefined) {
      record.addWrapper(wrapper, constraint, annotations);
      return record;
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
      record = new ProviderRecord(token, host);
      records.set(token, record);
    }
    return record;
  }

  /**
   * COMPONENTS
   */
  toComponentRecord<T>(
    comp: Type<T>,
    host: Injector,
    useWrapper?: Wrapper,
  ): ComponentRecord<T> {
    const def = this.getProviderDef(comp);
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
      // children: new Set(),
      // parents: new Set(),
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
    }

    // TODO: FIX TYPES!!!
    (session.instance as any) = instance;
    return instance;
  }

  /**
   * HELPERS
   */
  createOptions(token: Token): InjectionOptions {
    return {
      token,
      ctx: undefined,
      scope: undefined,
      labels: {},
    };
  }

  getScopeShape(scope: ScopeType): ScopeShape {
    if (scope && (scope as ScopeShape).kind === undefined) {
      scope = {
        kind: scope as Scope,
        options: undefined,
      }
    }
    return scope as ScopeShape;
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

  convertDependencies(deps: Array<Token | Wrapper>, factory: Function, options: { cache: boolean } = { cache: false }): InjectionArgument[] {
    const converted: InjectionArgument[] = [];
    for (let i = 0, l = deps.length; i < l; i++) {
      const dep = deps[i];
      if (isWrapper(dep)) {
        converted.push(createInjectionArg(undefined, options.cache ? Cache(dep) : dep, factory, undefined, i));
      } else {
        converted.push(createInjectionArg(dep, undefined, factory, undefined, i));
      }
    }
    return converted;
  }
}
