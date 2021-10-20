import { InjectableOptions, InjectionArgument, ProviderDef, InjectableMetadata, Type } from "../interfaces";
import { InjectorResolver } from "../injector/resolver";
import { Token } from "../types";
import { Reflection } from "../utils";
import { Cache } from "../wrappers/cache";
import { NewWrapper, Wrapper } from "../utils/wrappers";
import { InjectorMetadata } from "../injector";
import { PRIVATE_METADATA, METADATA, EMPTY_ARRAY } from "../constants";

export function Injectable<S>(options?: InjectableOptions<S>) {
  return function(target: Object) {
    applyProviderDef(target, options);
  }
}

export function injectableMixin<T, S>(target: Type<T>, options?: InjectableOptions<S>): Type<T> {
  typeof target === 'function' && applyProviderDef(target, options);
  return target;
}

export function getProviderDef<T>(provider: unknown): ProviderDef<T> | undefined {
  if (provider.hasOwnProperty(PRIVATE_METADATA.PROVIDER) === true) {
    return provider[PRIVATE_METADATA.PROVIDER];
  }
  return undefined;
}

export function applyProviderDef<T, S>(target: Object, options?: InjectableOptions<S>): ProviderDef<T> {
  const paramtypes = Reflection.getOwnMetadata("design:paramtypes", target) || EMPTY_ARRAY;
  const def = ensureProviderDef(target);
  def.options = Object.assign(def.options, options);

  // merge inline metadata
  const inlineMetadata = target[METADATA.PROVIDER] as InjectableMetadata<S>;
  if (inlineMetadata !== undefined) {
    def.injections = InjectorMetadata.combineDependencies(inlineMetadata.injections, def.injections, target);
    def.options = Object.assign(def.options, inlineMetadata.options);
  }

  // check inheritance
  inheritance(target, def, paramtypes);

  // create factory
  def.factory = InjectorResolver.createProviderFactory(target as Type<any>, def.injections);
  return def as ProviderDef<T>;
}

function ensureProviderDef<T>(provider: T): ProviderDef<T> {
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
      parameters[i] = createInjectionArg(param.token, param.wrapper, target, undefined, i);
    }
  }

  // override/adjust properties injection
  const props = injections.properties;
  const inheritedProps = inheritedInjections.properties;
  for (let key in inheritedProps) {
    const inheritedProp = inheritedProps[key];
    // shallow copy injection argument and override target
    props[key] = props[key] || createInjectionArg(inheritedProp.token, inheritedProp.wrapper, target, key);
  }
  // override/adjust symbols injection
  const symbols = Object.getOwnPropertySymbols(inheritedProps);
  for (let i = 0, l = symbols.length; i < l; i++) {
    const sym = symbols[i] as unknown as string;
    const inheritedProp = inheritedProps[sym];
    // shallow copy injection argument and override target
    props[sym] = props[sym] || createInjectionArg(inheritedProp.token, inheritedProp.wrapper, target, sym);
  }

  const targetMethods = Object.getOwnPropertyNames((target as any).prototype);
  // override/adjust methods injection
  for (let key in inheritedInjections.methods) {
    // check if target has method.
    // if yes, dev could make it injectable from scratch or override to pure (without injection) function in extended class.
    // if not, copy injections from parent class
    if (targetMethods.includes(key) === false) {
      const copiedMethod: InjectionArgument[] = [];
      const method = inheritedInjections.methods[key];
      for (let i = 0, l = method.length; i < l; i++) {
        const arg = method[i];
        // shallow copy injection argument and override target
        copiedMethod[i] = createInjectionArg(arg.token, arg.wrapper, target, key, i);
      }
      injections.methods[key] = copiedMethod;
    }
  }
}

function mergeParameters(definedArgs: Array<InjectionArgument>, paramtypes: Array<Type>, target: Object): void {
  for (let i = 0, l = paramtypes.length; i < l; i++) {
    definedArgs[i] = definedArgs[i] || createInjectionArg(paramtypes[i], undefined, target, undefined, i);
  }
}

export function applyInjectionArg(
  token: Token,
  wrapper: Wrapper | NewWrapper | Array<NewWrapper>,
  target: Object,
  key?: string | symbol,
  index?: number | PropertyDescriptor,
): InjectionArgument {
  if (key !== undefined) {
    target = target.constructor;
  }
  let injections = ensureProviderDef(target).injections;
  if (key !== undefined) {
    if (typeof index === "number") {
      // methods
      const method = (injections.methods[key as string] || (injections.methods[key as string] = []));
      return method[index] || (method[index] = createInjectionArg(token, wrapper, target, key, index));
    }
    // properties
    return injections.properties[key as string] = createInjectionArg(token, wrapper, target, key);
  }
  // constructor parameters
  return injections.parameters[index as number] = createInjectionArg(token, wrapper, target, undefined, index as number);
}

export function createInjectionArg(token: Token, wrapper: Wrapper | NewWrapper | Array<NewWrapper>, target: Object, propertyKey?: string | symbol, index?: number): InjectionArgument {
  return {
    token,
    wrapper: wrapper, // Cache(wrapper),
    metadata: {
      target,
      propertyKey,
      index,
    },
  }
}
