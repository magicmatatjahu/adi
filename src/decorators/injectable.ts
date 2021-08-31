import { InjectableOptions, InjectionArgument, PlainInjections, ProviderDef, StaticInjectable, Type } from "../interfaces";
import { InjectorResolver } from "../injector/resolver";
import { Token } from "../types";
import { Reflection } from "../utils";
import { Cache } from "../wrappers/cache";
import { Wrapper } from "../utils/wrappers";
import { InjectorMetadata } from "../injector";

export function Injectable<S>(options?: InjectableOptions<S>) {
  return function(target: Object) {
    const params = Reflection.getOwnMetadata("design:paramtypes", target);
    applyProviderDef(target, params, options);
  }
}

export function injectableMixin<T, S>(target: Type<T>, options?: InjectableOptions<S>): Type<T> {
  Injectable(options)(target);
  return target;
}

export function getProviderDef<T>(provider: unknown): ProviderDef<T> | undefined {
  return provider['$$prov'] || undefined;
}

export function applyProviderDef<T, S>(target: Object, paramtypes: Array<Type> = [], options?: InjectableOptions<S>): ProviderDef<T> {
  const def = ensureProviderDef(target);
  def.options = Object.assign(def.options, options);

  // merge inline definition
  const provider = (target as any).provider as StaticInjectable<S>;
  if (provider !== undefined) {
    def.injections = InjectorMetadata.combineDependencies(provider.injections, def.injections, target);
    def.options = Object.assign(def.options, provider.options);
  }

  // check inheritance
  lookupInheritance(target, def, paramtypes);
  def.factory = InjectorResolver.createProviderFactory(target as Type<any>, def.injections);
  return def as ProviderDef<T>;
}

function ensureProviderDef<T>(provider: T): ProviderDef<T> {
  if (!provider.hasOwnProperty('$$prov')) {
    Object.defineProperty(provider, '$$prov', { value: defineProviderDef(provider), enumerable: true });
  }
  return provider['$$prov'];
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

// merge def from parent class
function lookupInheritance(target: Object, def: ProviderDef, paramtypes: Array<Type>): void {
  let inheritedClass = Object.getPrototypeOf(target);

  // case when base class is not decorated by @Injectable()
  // inheritedClass.length means arguments of constructor
  if (inheritedClass && inheritedClass.length > 0) {
    inheritedClass = injectableMixin(inheritedClass);
  }
  const inheritedDef = getProviderDef(inheritedClass);

  // when inheritedDef doesn't exist, then merge constructor params
  if (!inheritedDef) {
    mergeParameters(def.injections.parameters, paramtypes, target);
    return;
  }

  const injections = def.injections;
  const inheritedInjection = inheritedDef.injections;

  // override/adjust constructor injection
  // if class has defined paramtypes, then skip overriding parameters from parent class
  const parameters = injections.parameters;
  if (paramtypes.length > 0) {
    mergeParameters(parameters, paramtypes, target);
  } else {
    // definedArgs is empty array in case of merging parent ctor arguments
    const inheritedParameters = inheritedInjection.parameters;
    for (let i = 0, l = inheritedParameters.length; i < l; i++) {
      const param = inheritedParameters[i]
      parameters[i] = createInjectionArg(param.token, param.wrapper, target, undefined, i);
    }
  }

  // override/adjust properties injection
  const props = injections.properties;
  const inheritedProps = inheritedInjection.properties;
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
  for (let key in inheritedInjection.methods) {
    // check if target has method.
    // if yes, dev could make it injectable from scratch or override to pure (without injection) function in extended class.
    // if not, copy injections from parent class
    if (targetMethods.includes(key) === false) {
      const copiedMethod: InjectionArgument[] = [];
      const method = inheritedInjection.methods[key];
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
  wrapper: Wrapper,
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

export function createInjectionArg(token: Token, wrapper: Wrapper, target: Object, propertyKey?: string | symbol, index?: number): InjectionArgument {
  return {
    token,
    wrapper: Cache(wrapper),
    metadata: {
      target,
      propertyKey,
      index,
    },
  }
}
