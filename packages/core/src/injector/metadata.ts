import { Injector } from ".";
import { createInjectionArg, createMethodInjection, getModuleDef, getProviderDef, injectableMixin, moduleMixin } from "../decorators";
import { 
  Provider, TypeProvider,
  ProviderDef, FactoryDef, Type,
  InjectionArgument, PlainProvider, InjectableOptions, ScopeShape, ScopeType, InjectionArguments, PlainInjections, InjectionItem, ModuleMetadata, ClassProvider, Annotations, PlainInjectionItem,
} from "../interfaces";
import { isFactoryProvider, isValueProvider, isClassProvider, isExistingProvider, hasWrapperProvider, isWrapper } from "../utils";
import { Token } from "../types";
import { Scope } from "../scope";
import { EMPTY_ARRAY, EMPTY_OBJECT } from "../constants";

import { ProviderRecord } from "./provider";
import { InjectorResolver } from "./resolver";

import { pushWrapper, Wrapper } from "../utils/wrappers";
import { UseExisting } from "../wrappers/internal";
import { InjectionKind } from "../enums";

export const InjectorMetadata = new class {
  /**
   * PROVIDERS
   */
  toRecord<T>(
    provider: Provider<T>,
    host: Injector,
    isComponent: boolean = false,
  ): ProviderRecord {
    if (typeof provider === "function") {
      return this.typeProviderToRecord(provider, host, isComponent);
    } else {
      return this.customProviderToRecord(provider.provide, provider, host, isComponent);
    }
  }

  typeProviderToRecord<T>(
    provider: TypeProvider<T>,
    host: Injector,
    isComponent?: boolean,
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
      return this.customProviderToRecord(provider, customProvider, host, isComponent);
    }

    const record = this.getRecord(provider, host, isComponent);

    let factory = provDef.factory;
    let wrapper = options.useWrapper;
    const { imports, providers } = options as ClassProvider;
    if (imports || providers) {
      factory = InjectorResolver.createInjectorFactory(factory, imports, providers);
    }

    record.addDefinition(factory, this.getScopeShape(options.scope), undefined, wrapper, options.annotations || EMPTY_OBJECT, provider.prototype);
    return record;
  }

  customProviderToRecord<T>(
    token: Token<T>,
    provider: PlainProvider<T>,
    host: Injector,
    isComponent?: boolean,
  ): ProviderRecord {
    const record = this.getRecord(token, host, isComponent);
    const constraint = provider.when;
    let factory: FactoryDef = undefined,
      wrapper: Wrapper | Array<Wrapper> = undefined,
      scope: ScopeShape = this.getScopeShape((provider as any).scope),
      annotations: Annotations = provider.annotations || EMPTY_OBJECT,
      proto = undefined;

    if (hasWrapperProvider(provider)) {
      wrapper = provider.useWrapper;
    }

    if (isFactoryProvider(provider)) {
      factory = InjectorResolver.createFactory(provider.useFactory, provider.inject || EMPTY_ARRAY, provider.imports, provider.providers);
    } else if (isValueProvider(provider)) {
      factory = () => provider.useValue;
    } else if (isExistingProvider(provider)) {
      wrapper = pushWrapper(wrapper, UseExisting(provider.useExisting))
      factory = () => {};
    } else if (isClassProvider(provider)) {
      const { useClass, inject, imports, providers } = provider;

      const providerDef = this.getProviderDef(useClass, true);
      proto = useClass;

      const injections = this.combineDependencies(inject, providerDef.injections, useClass);
      factory = InjectorResolver.createProviderFactory(useClass, injections, imports, providers);
      
      const options = providerDef.options;
      if (options) {
        // override scope if can be overrided
        const targetScope = this.getScopeShape(options.scope);
        if (targetScope && targetScope.kind.canBeOverrided() === false) {
          scope = targetScope;
        }
        // override annotations
        annotations = Object.assign(annotations === EMPTY_OBJECT ? {} : annotations, options.annotations);
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
    isComponent: boolean,
  ): ProviderRecord {
    let records: Map<Token, ProviderRecord> = host.records;
    if (isComponent === true) {
      records = host.components;
    }

    let record = records.get(token);
    if (record === undefined) {
      record = new ProviderRecord(token, host, isComponent);
      records.set(token, record);
    }
    return record;
  }

  /**
   * COMPONENTS
   */
  toComponent<T>(
    component: Provider<T>,
    host: Injector,
  ): ProviderRecord {
    return this.toRecord(component, host, true);
  }

  /**
   * HELPERS
   */
  getScopeShape(scope: ScopeType): ScopeShape {
    if (scope && (scope as ScopeShape).kind === undefined) {
      scope = {
        kind: scope as Scope,
        options: undefined,
      }
    }
    return scope as ScopeShape;
  }

  getProviderDef(token: unknown, strict: boolean = true): ProviderDef {
    let providerDef = getProviderDef(token);
    if (providerDef === undefined || providerDef.factory === undefined) {
      // using injectableMixin() as fallback for decorated classes with different decorator than @Injectable() or @Module()
      // collect only constructor params
      providerDef = getProviderDef(injectableMixin(token as Type));
      if (providerDef === undefined && strict === true) {
        throw new Error('Cannot get provider def');
      }
    }
    return providerDef;
  }

  getModuleDef(target: unknown, strict: boolean = true): ModuleMetadata {
    let moduleDef = getModuleDef(target);
    if (moduleDef === undefined) {
      // check if the inlined metadata is defined 
      moduleDef = getModuleDef(moduleMixin(target as Type));
      if (moduleDef === undefined && strict === true) {
        throw new Error('Cannot get module def');
      }
    }
    return moduleDef;
  }

  convertDependencies(deps: Array<InjectionItem>, kind: InjectionKind, target: Object, methodName?: string | symbol): InjectionArgument[] {
    const converted: InjectionArgument[] = [];
    for (let i = 0, l = deps.length; i < l; i++) {
      converted.push(this.convertDependency(deps[i], kind, target, methodName, i));
    }
    return converted;
  }

  convertDependency(dep: InjectionItem, kind: InjectionKind, target: Object, propertyKey?: string | symbol, index?: number, handler?: Function): InjectionArgument {
    // wrapper case
    if (isWrapper(dep)) {
      return createInjectionArg(undefined, dep, undefined, kind, target, propertyKey, index, handler);
    }
    // plain injection case
    if ((dep as PlainInjectionItem).token !== undefined) {
      const plainDep = dep as PlainInjectionItem;
      return createInjectionArg(plainDep.token, plainDep.wrapper, plainDep.annotations, kind, target, propertyKey, index, handler);
    }
    // standalone token case
    return createInjectionArg(dep as Token, undefined, undefined, kind, target, propertyKey, index, handler);
  }

  combineArrayDependencies(
    toCombine: Array<InjectionItem>,
    original: Array<InjectionArgument>,
    kind: InjectionKind,
    override?: (injectionArg: InjectionArgument) => InjectionItem | undefined,
    target?: Object,
    methodName?: string,
    handler?: Function,
  ): Array<InjectionArgument> {
    if (toCombine === undefined && override === undefined) {
      return original;
    }
    const newDeps = original ? [...original] : [];

    if (typeof override === 'function') {
      let inject: InjectionItem;
      for (let i = 0, l = newDeps.length; i < l; i++) {
        inject = override(newDeps[i]);
        inject && (newDeps[i] = this.convertDependency(inject, kind, target, methodName, i, handler));
      }
    }
    if (toCombine !== undefined) {
      for (let i = 0, l = toCombine.length; i < l; i++) {
        if (toCombine[i] !== undefined) {
          newDeps[i] = this.convertDependency(toCombine[i], kind, target, methodName, i, handler);
        }
      }
    }
    return newDeps;
  }

  // split this function to separate ones and optimize it
  combineDependencies(
    toCombine: Array<InjectionItem>,
    original: Array<InjectionArgument>,
    target: Object,
  ): Array<InjectionArgument>
  combineDependencies(
    toCombine: Array<InjectionItem> | PlainInjections,
    original: InjectionArguments,
    target: Object,
  ): InjectionArguments
  combineDependencies(
    toCombine: Array<InjectionItem> | PlainInjections,
    original: Array<InjectionArgument> | InjectionArguments,
    target: Object,
  ): Array<InjectionArgument> | InjectionArguments {
    if (toCombine === undefined) {
      return original;
    }

    if (Array.isArray(original)) {
      if (Array.isArray(toCombine)) {
        return this.combineArrayDependencies(toCombine, original, InjectionKind.PARAMETER, undefined, target);
      }
      return this.combineArrayDependencies(toCombine.parameters, original, InjectionKind.PARAMETER, toCombine.override, target);
    }

    const newDeps: InjectionArguments = {
      parameters: [...original.parameters],
      properties: { ...original.properties },
      methods: { ...original.methods },
    };

    if (Array.isArray(toCombine)) {
      newDeps.parameters = this.combineArrayDependencies(toCombine, newDeps.parameters, InjectionKind.PARAMETER, undefined, target);
      return newDeps;
    }

    const { parameters, properties, methods, override } = toCombine;
    // parameters
    newDeps.parameters = this.combineArrayDependencies(parameters, newDeps.parameters, InjectionKind.PARAMETER, override, target);
    // properties and symbols 
    if (typeof override === 'function') {
      let inject: InjectionItem;
      for (const propName in newDeps.properties) {
        inject = override(newDeps.properties[propName]);
        inject && (newDeps.properties[propName] = this.convertDependency(inject, InjectionKind.PROPERTY, target, propName));
      }
      for (const sb of Object.getOwnPropertySymbols(newDeps.properties)) {
        inject = override(newDeps.properties[sb as unknown as string]);
        inject && (newDeps.properties[sb as unknown as string] = this.convertDependency(inject, InjectionKind.PROPERTY, target, sb));
      }
    }
    if (properties !== undefined) {
      for (const propName in properties) {
        newDeps.properties[propName] = this.convertDependency(properties[propName], InjectionKind.PROPERTY, target, propName);
      }
      for (const sb of Object.getOwnPropertySymbols(properties)) {
        newDeps.properties[sb as unknown as string] = this.convertDependency(properties[sb as unknown as string], InjectionKind.PROPERTY, target, sb);
      }
    }
    // methods
    if (typeof override === 'function') {
      const m = methods || {};
      for (const methodName in newDeps.methods) {
        newDeps.methods[methodName] = newDeps.methods[methodName] || createMethodInjection();
        const handler = Object.getOwnPropertyDescriptor((target as any).prototype, methodName);
        newDeps.methods[methodName].injections = this.combineArrayDependencies(m[methodName], newDeps.methods[methodName].injections, InjectionKind.METHOD, override, target, methodName, handler && handler.value);
      }
    } else {
      for (const methodName in methods) {
        newDeps.methods[methodName] = newDeps.methods[methodName] || createMethodInjection();
        const handler = Object.getOwnPropertyDescriptor((target as any).prototype, methodName);
        newDeps.methods[methodName].injections = this.combineArrayDependencies(methods[methodName], newDeps.methods[methodName].injections, InjectionKind.METHOD, undefined, target, methodName, handler.value);
      }
    }

    return newDeps;
  }
}
