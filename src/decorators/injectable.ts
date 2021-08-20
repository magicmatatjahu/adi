import { InjectableOptions, InjectionArgument, ProviderDef, Type } from "../interfaces";
import { InjectorResolver } from "../injector/resolver";
import { Scope } from "../scope";
import { Token } from "../types";
import { Reflection } from "../utils";
import { Cache } from "../wrappers/cache";
import { Wrapper } from "../utils/wrappers";

export function Injectable<S>(options?: InjectableOptions<S>) {
  return function(target: Object) {
    const params = Reflection.getOwnMetadata("design:paramtypes", target);
    applyProviderDef(target, params, options);
  }
}

export function injectableMixin<T, S>(clazz: Type<T>, options?: InjectableOptions<S>): Type<T> {
  Injectable(options)(clazz);
  return clazz;
}

export function getProviderDef<T>(provider: unknown): ProviderDef<T> | undefined {
  return provider['$$prov'] || undefined;
}

export function applyProviderDef<T, S>(target: Object, paramtypes: Array<Type> = [], options?: InjectableOptions<S>): ProviderDef<T> {
  const def = ensureProviderDef(target);
  def.options = options;
  lookupInheritance(target, def, paramtypes);  
  def.factory = InjectorResolver.createFactory(target as Type<any>, def);
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
    scope: Scope.DEFAULT,
    provideIn: undefined,
    options: {},
    args: {
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
    mergeParameters(def.args.parameters, paramtypes, target);
    return;
  }

  const defArgs = def.args;
  const inheritedDefArgs = inheritedDef.args;

  // override/adjust constructor injection
  // if class has defined paramtypes, then skip overriding parameters from parent class
  const parameters = defArgs.parameters;
  if (paramtypes.length > 0) {
    mergeParameters(parameters, paramtypes, target);
  } else {
    // definedArgs is empty array in case of merging parent ctor arguments
    const inheritedParameters = inheritedDefArgs.parameters;
    for (let i = 0, l = inheritedParameters.length; i < l; i++) {
      const param = inheritedParameters[i]
      parameters[i] = createInjectionArg(param.token, param.wrapper, target, undefined, i);
    }
  }

  // override/adjust properties injection
  const props = defArgs.properties;
  const inheritedProps = inheritedDefArgs.properties;
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
  for (let key in inheritedDefArgs.methods) {
    // check if target has method.
    // if yes, dev could make it injectable from scratch or override to pure (without injection) function in extended class.
    // if not, copy injections from parent class
    if (targetMethods.includes(key) === false) {
      const copiedMethod: InjectionArgument[] = [];
      const method = inheritedDefArgs.methods[key];
      for (let i = 0, l = method.length; i < l; i++) {
        const arg = method[i];
        // shallow copy injection argument and override target
        copiedMethod[i] = createInjectionArg(arg.token, arg.wrapper, target, key, i);
      }
      defArgs.methods[key] = copiedMethod;
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
  let args = ensureProviderDef(target).args;
  if (key !== undefined) {
    if (typeof index === "number") {
      // methods
      const method = (args.methods[key as string] || (args.methods[key as string] = []));
      return method[index] || (method[index] = createInjectionArg(token, wrapper, target, key, index));
    }
    // properties
    return args.properties[key as string] = createInjectionArg(token, wrapper, target, key);
  }
  // constructor parameters
  return args.parameters[index as number] = createInjectionArg(token, wrapper, target, undefined, index as number);
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
