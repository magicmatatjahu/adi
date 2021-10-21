import { Injector } from ".";
import { createInjectionArg, getModuleDef, getProviderDef, injectableMixin, moduleMixin } from "../decorators";
import { 
  Provider, TypeProvider,
  ProviderDef, FactoryDef, Type,
  InjectionArgument, PlainProvider, InjectableOptions, ScopeShape, ScopeType, InjectionArguments, PlainInjections, InjectionItem, ModuleMetadata,
} from "../interfaces";
import { isFactoryProvider, isValueProvider, isClassProvider, isExistingProvider, hasWrapperProvider, isWrapper, hasNewWrapperProvider, isNewWrapper } from "../utils";
import { Token } from "../types";
import { Scope } from "../scope";
import { EMPTY_ARRAY, EMPTY_OBJECT } from "../constants";

import { ProviderRecord } from "./provider";
import { InjectorResolver } from "./resolver";

import { copyWrappers, NewWrapper, Wrapper } from "../utils/wrappers";
import { UseExisting } from "../wrappers/internal";

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
    record.addDefinition(provDef.factory, this.getScopeShape(options.scope), undefined, options.useWrapper, options.annotations || EMPTY_OBJECT, provider.prototype);
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
      wrapper: Wrapper | NewWrapper | Array<NewWrapper> = undefined,
      scope: ScopeShape = this.getScopeShape((provider as any).scope),
      annotations: Record<string | symbol, any> = provider.annotations || EMPTY_OBJECT,
      proto = undefined;

    if (hasWrapperProvider(provider) || hasNewWrapperProvider(provider)) {
      wrapper = provider.useWrapper;
    }

    if (isFactoryProvider(provider)) {
      factory = InjectorResolver.createFactory(provider.useFactory, provider.inject || EMPTY_ARRAY);
    } else if (isValueProvider(provider)) {
      factory = () => provider.useValue;
    } else if (isExistingProvider(provider)) {
      const aliasProvider = provider.useExisting;
      // copy wrapper and add to the end the new one 
      if (wrapper) {
        // TODO: Change it
        wrapper = copyWrappers(wrapper as Wrapper);
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
      proto = classRef;

      const injections = this.combineDependencies(provider.inject, providerDef.injections, classRef);
      factory = InjectorResolver.createProviderFactory(classRef, injections);
      
      const options = providerDef.options || EMPTY_OBJECT as InjectableOptions<any>;
      // override scope if can be overrided
      const targetScope = this.getScopeShape(options.scope);
      if (targetScope && targetScope.kind.canBeOverrided() === false) {
        scope = targetScope;
      }
      // override annotations
      annotations = Object.assign(annotations === EMPTY_OBJECT ? {} : annotations, options.annotations);
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

  convertDependencies(deps: Array<InjectionItem>, target: Object, methodName?: string | symbol): InjectionArgument[] {
    const converted: InjectionArgument[] = [];
    for (let i = 0, l = deps.length; i < l; i++) {
      converted.push(this.convertDependency(deps[i], target, methodName, i));
    }
    return converted;
  }

  convertDependency(dep: InjectionItem, target: Object, propertyKey?: string | symbol, index?: number): InjectionArgument {
    if (isWrapper(dep) || isNewWrapper(dep) || Array.isArray(dep)) {
      return createInjectionArg(undefined, dep, target, propertyKey, index);
    }
    if ((dep as any).token !== undefined) {
      return createInjectionArg((dep as any).token, (dep as any).wrapper, target, propertyKey, index);
    }
    return createInjectionArg(dep as Token, undefined, target, propertyKey, index);
  }

  combineArrayDependencies(
    toCombine: Array<InjectionItem>,
    original: Array<InjectionArgument>,
    target?: Object,
    methodName?: string,
    dynamic?: (injectionArg: InjectionArgument) => InjectionItem | undefined,
  ): Array<InjectionArgument> {
    if (toCombine === undefined && dynamic === undefined) {
      return original;
    }
    const newDeps = original ? [...original] : [];

    if (typeof dynamic === 'function') {
      let inject: InjectionItem;
      for (let i = 0, l = newDeps.length; i < l; i++) {
        inject = dynamic(newDeps[i]);
        inject && (newDeps[i] = this.convertDependency(inject, target, methodName, i));
      }
    }
    if (toCombine !== undefined) {
      for (let i = 0, l = toCombine.length; i < l; i++) {
        if (toCombine[i] !== undefined) {
          newDeps[i] = this.convertDependency(toCombine[i], target, methodName, i);
        }
      }
    }
    return newDeps;

  }

  // split this function to separate ones and optimize it
  combineDependencies(
    toCombine: Array<InjectionItem> | PlainInjections,
    original: InjectionArguments,
    target: Object,
  ): InjectionArguments {
    if (toCombine === undefined) {
      return original;
    }
    const newDeps: InjectionArguments = {
      parameters: [...original.parameters],
      properties: { ...original.properties },
      methods: { ...original.methods },
    };

    if (Array.isArray(toCombine)) {
      newDeps.parameters = this.combineArrayDependencies(toCombine, newDeps.parameters, target);
      return newDeps;
    }

    const { parameters, properties, methods, dynamic } = toCombine;
    // parameters
    newDeps.parameters = this.combineArrayDependencies(parameters, newDeps.parameters, target, undefined, dynamic);
    // properties and symbols 
    if (typeof dynamic === 'function') {
      let inject: InjectionItem;
      for (const propName in newDeps.properties) {
        inject = dynamic(newDeps.properties[propName]);
        inject && (newDeps.properties[propName] = this.convertDependency(inject, target, propName));
      }
      for (const sb of Object.getOwnPropertySymbols(newDeps.properties)) {
        inject = dynamic(newDeps.properties[sb as unknown as string]);
        inject && (newDeps.properties[sb as unknown as string] = this.convertDependency(inject, target, sb));
      }
    }
    if (properties !== undefined) {
      for (const propName in properties) {
        newDeps.properties[propName] = this.convertDependency(properties[propName], target, propName);
      }
      for (const sb of Object.getOwnPropertySymbols(properties)) {
        newDeps.properties[sb as unknown as string] = this.convertDependency(properties[sb as unknown as string], target, sb);
      }
    }
    // methods
    if (typeof dynamic === 'function') {
      const m = methods || {};
      for (const methodName in newDeps.methods) {
        newDeps.methods[methodName] = this.combineArrayDependencies(m[methodName], newDeps.methods[methodName], target, methodName, dynamic);
      }
    } else {
      for (const methodName in methods) {
        newDeps.methods[methodName] = this.combineArrayDependencies(methods[methodName], newDeps.methods[methodName], target, methodName);
      }
    }

    return newDeps;
  }
}
