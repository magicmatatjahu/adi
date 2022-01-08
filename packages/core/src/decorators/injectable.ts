import { InjectableOptions, InjectionArgument, InjectionMethod, ProviderDef, InjectableMetadata, Type, Annotations } from "../interfaces";
import { InjectorResolver } from "../injector/resolver";
import { Token } from "../types";
import { Reflection } from "../utils";
import { Cache } from "../wrappers/cache";
import { CoreHook } from "../wrappers/internal";
import { Wrapper } from "../utils/wrappers";
import { PRIVATE_METADATA, METADATA, EMPTY_ARRAY } from "../constants";
import { InjectionKind } from "../enums";

import { combineDependencies } from "../injector/metadata";

export function Injectable<S>(options?: InjectableOptions<S>) {
  return function(target: Object) {
    applyProviderDef(target, options);
  }
}

export function injectableMixin<T, S>(target: Type<T>, options?: InjectableOptions<S>): Type<T> {
  applyProviderDef(target, options);
  return target;
}

export function getProviderDef<T>(provider: unknown): ProviderDef<T> | undefined {
  if (provider && provider.hasOwnProperty(PRIVATE_METADATA.PROVIDER) === true) {
    return provider[PRIVATE_METADATA.PROVIDER];
  }
  return;
}

export function applyProviderDef<T, S>(target: Object, options?: InjectableOptions<S>): ProviderDef<T> | undefined {
  if (typeof target !== 'function') return;

  const paramtypes = Reflection.getOwnMetadata("design:paramtypes", target) || EMPTY_ARRAY;
  const def = ensureProviderDef(target);
  def.options = Object.assign(def.options, options);

  // merge inline metadata
  const inlineMetadata = target[METADATA.PROVIDER] as InjectableMetadata<S>;
  if (inlineMetadata !== undefined) {
    def.injections = combineDependencies(inlineMetadata.injections, def.injections, target);
    def.options = Object.assign(def.options, inlineMetadata.options);
  }

  // check inheritance
  inheritance(target, def, paramtypes);

  // create factory
  def.factory = InjectorResolver.createProviderFactory(target as Type<any>, def.injections);
  return def as unknown as ProviderDef<T>;
}

export function ensureProviderDef<T>(provider: T): ProviderDef<T> {
  if (!provider.hasOwnProperty(PRIVATE_METADATA.PROVIDER)) {
    Object.defineProperty(provider, PRIVATE_METADATA.PROVIDER, { value: defineProviderDef(provider), enumerable: true });
  }
  return provider[PRIVATE_METADATA.PROVIDER];
}

function defineProviderDef<T>(provider: T): ProviderDef<T> {
  return {
    token: provider,
    factory: undefined,
    options: {},
    injections: {
      parameters: [],
      properties: {},
      methods: {},
    },
  };
}

function inheritance(target: any, def: ProviderDef, paramtypes: Array<Type>): void {
  // when class is not extended, then merge constructor params and return
  if (target.prototype.__proto__ === Object.prototype) {
    mergeParameters(def.injections.parameters, paramtypes, target);
    return;
  }

  let inheritedClass = Object.getPrototypeOf(target);
  let inheritedDef = getProviderDef(inheritedClass);
  if (
    inheritedDef === undefined || 
    // checks whether the provider definition has been fully initialized - by saving provider's configuration
    inheritedDef.factory === undefined
  ) {
    inheritedDef = getProviderDef(injectableMixin(inheritedClass));
  }

  // override (shallow) options
  def.options = { ...inheritedDef.options, ...def.options };

  const injections = def.injections;
  const inheritedInjections = inheritedDef.injections;

  // override/adjust constructor injection
  // if class has defined paramtypes, then skip overriding parameters from parent class
  const parameters = injections.parameters;
  if (paramtypes.length > 0) {
    mergeParameters(parameters, paramtypes, target);
  } else {
    // definedArgs is empty array in case of merging parent ctor arguments
    const inheritedParameters = inheritedInjections.parameters;
    for (let i = 0, l = inheritedParameters.length; i < l; i++) {
      const param = inheritedParameters[i]
      parameters[i] = createInjectionArg(param.token, param.wrapper, param.metadata.annotations, InjectionKind.PARAMETER, target, undefined, i);
    }
  }

  // override/adjust properties injection
  const props = injections.properties;
  const inheritedProps = inheritedInjections.properties;
  for (let key in inheritedProps) {
    const inheritedProp = inheritedProps[key];
    // shallow copy injection argument and override target
    props[key] = props[key] || createInjectionArg(inheritedProp.token, inheritedProp.wrapper, inheritedProp.metadata.annotations, target, key);
  }
  // override/adjust symbols injection
  const symbols = Object.getOwnPropertySymbols(inheritedProps);
  for (let i = 0, l = symbols.length; i < l; i++) {
    const sym = symbols[i] as unknown as string;
    const inheritedProp = inheritedProps[sym];
    // shallow copy injection argument and override target
    props[sym] = props[sym] || createInjectionArg(inheritedProp.token, inheritedProp.wrapper, inheritedProp.metadata.annotations, target, sym);
  }

  const targetMethods = Object.getOwnPropertyNames((target as any).prototype);
  // override/adjust methods injection
  for (let key in inheritedInjections.methods) {
    // check if target has method.
    // if yes, dev could make it injectable from scratch or override to pure (without injection) function in extended class.
    // if not, copy injections from parent class
    if (targetMethods.includes(key) === false) {
      const copiedMethod: InjectionArgument[] = [];
      const method = inheritedInjections.methods[key].injections;
      for (let i = 0, l = method.length; i < l; i++) {
        const arg = method[i];
        // shallow copy injection argument and override target
        // TODO: Check what handler should be passed, from new class or from parent class 
        copiedMethod[i] = createInjectionArg(arg.token, arg.wrapper, arg.metadata.annotations, InjectionKind.METHOD, target, key, i, arg.metadata.handler);
      }
      injections.methods[key].injections = copiedMethod;
    }
  }
}

function mergeParameters(definedArgs: Array<InjectionArgument>, paramtypes: Array<Type>, target: Object): void {
  for (let i = 0, l = paramtypes.length; i < l; i++) {
    definedArgs[i] = definedArgs[i] || createInjectionArg(paramtypes[i], undefined, undefined, InjectionKind.PARAMETER, target, undefined, i);
  }
}

export function applyInjectionArg(
  token: Token,
  wrapper: Wrapper | Array<Wrapper>,
  annotations: Annotations,
  target: Object,
  key?: string | symbol,
  index?: number | PropertyDescriptor,
  handler?: Function,
): InjectionArgument {
  if (key !== undefined) {
    target = target.constructor;
  }
  if (key !== undefined) {
    if (typeof index === "number") {
      // methods
      const method = getMethod(target, key);
      return method.injections[index] || (method.injections[index] = createInjectionArg(token, wrapper, annotations, InjectionKind.METHOD, target, key, index, handler));
    }
    // properties
    const properties = ensureProviderDef(target).injections.properties;
    return properties[key as string] = createInjectionArg(token, wrapper, annotations, InjectionKind.PROPERTY, target, key);
  }
  // constructor parameters
  const parameters = ensureProviderDef(target).injections.parameters;
  return parameters[index as number] = createInjectionArg(token, wrapper, annotations, InjectionKind.PARAMETER, target, undefined, index as number);
}

export function getMethod(target: Object, methodName: string | symbol) {
  const injections = ensureProviderDef(target).injections;
  return (injections.methods[methodName as string] || (injections.methods[methodName as string] = createMethodInjection(target, methodName)));
}

export function createMethodInjection(target: Object, methodName: string | symbol): InjectionMethod {
  const handler = Object.getOwnPropertyDescriptor((target as any).prototype, methodName);
  return { handler: handler?.value, injections: [], middlewares: [], interceptors: [], guards: [], pipes: [], eHandlers: [] }
}

export function createInjectionArg(
  token: Token, 
  wrapper: Wrapper | Array<Wrapper>, 
  annotations: Annotations, 
  kind: InjectionKind, 
  target: Object, 
  propertyKey?: string | symbol, 
  index?: number, 
  handler?: Function,
): InjectionArgument {
  if (wrapper !== undefined) {
    wrapper = Array.isArray(wrapper) ? [Cache(), CoreHook(), ...wrapper] : [Cache(), CoreHook(), wrapper];
  } else {
    wrapper = [Cache(), CoreHook()];
  }

  return {
    token,
    wrapper: wrapper,
    metadata: {
      target,
      propertyKey,
      index,
      handler,
      annotations,
      kind,
    },
  }
}
