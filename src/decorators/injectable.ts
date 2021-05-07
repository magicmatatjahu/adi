import { InjectableOptions, InjectionArgument, ProviderDef, WrapperDef, Type } from "../interfaces";
import { InjectorResolver } from "../injector/resolver";
import { Scope } from "../scope";
import { Reflection } from "../utils";
import { Token } from "../types";

export function Injectable(options?: InjectableOptions) {
  return function(target: Object) {
    const params = Reflection.getOwnMetadata("design:paramtypes", target);
    applyProviderDef(target, params, options);
  }
}

export function injectableMixin<T>(clazz: Type<T>, options?: InjectableOptions): Type<T> {
  Injectable(options)(clazz);
  return clazz;
}

export function getProviderDef<T>(provider: unknown): ProviderDef<T> | undefined {
  return provider['$$prov'] || undefined;
}

export function applyProviderDef<T>(target: Object, paramtypes: Array<Type> = [], options?: InjectableOptions): ProviderDef<T> {
  const def = ensureProviderDef(target);
  if (options) {
    def.providedIn = options.providedIn || def.providedIn;
    def.scope = options.scope || def.scope;
  }
  applyInheritance(target, def, paramtypes);  
  def.factory = InjectorResolver.providerFactory(target as Type<any>, def);
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
    providedIn: undefined,
    args: {
      ctor: [],
      props: {},
      methods: {},
    },
  };
}

// merge def from parent class
function applyInheritance(target: Object, def: ProviderDef, paramtypes: Array<Type>): void {
  let inheritedClass = Object.getPrototypeOf(target);
  // case when base class is not decorated by @Injectable()
  // inheritedClass.length means arguments of constructor
  if (inheritedClass && inheritedClass.length > 0) {
    inheritedClass = injectableMixin(inheritedClass);
  }
  let inheritedDef = getProviderDef(inheritedClass);

  // when inheritedDef doesn't exist, then merge constructor params
  if (!inheritedDef) {
    mergeCtorArgs(def.args.ctor, paramtypes, target);
    return;
  }

  const defArgs = def.args;
  const inheritedDefArgs = inheritedDef.args;

  // override/adjust constructor injection
  // if class has defined paramtypes, then skip overriding parameters from parent class
  const ctor = defArgs.ctor;
  if (paramtypes.length > 0) {
    mergeCtorArgs(ctor, paramtypes, target);
  } else {
    // definedArgs is empty array in case of merging parent ctor arguments
    const inheritedArgs = inheritedDefArgs.ctor;
    for (let i = 0, l = inheritedArgs.length; i < l; i++) {
      const arg = inheritedArgs[i]
      ctor[i] = createInjectionArg(arg.token, arg.options.useWrapper, target, undefined, i);
    }
  }

  // override/adjust properties injection
  const props = defArgs.props;
  const inheritedProps = inheritedDefArgs.props;
  for (let key in inheritedProps) {
    const inheritedProp = inheritedProps[key];
    // shallow copy injection argument and override target
    props[key] = props[key] || createInjectionArg(inheritedProp.token, inheritedProp.options.useWrapper, target, key);
  }
  // override/adjust symbols injection
  const symbols = Object.getOwnPropertySymbols(inheritedProps);
  for (let i = 0, l = symbols.length; i < l; i++) {
    const s = symbols[i] as unknown as string;
    const inheritedProp = inheritedProps[s];
    // shallow copy injection argument and override target
    props[s] = props[s] || createInjectionArg(inheritedProp.token, inheritedProp.options.useWrapper, target, s);
  }

  const targetMethods = Object.getOwnPropertyNames((target as any).prototype);
  // override/adjust methods injection
  for (let key in inheritedDefArgs.methods) {
    // check if target has method.
    // if yes, dev could make it injectable or override to pure (without injection) function in extended class.
    // if not, copy injections from parent class
    if (targetMethods.includes(key) === false) {
      const copiedMethod: InjectionArgument[] = [];
      const method = inheritedDefArgs.methods[key];
      for (let i = 0, l = method.length; i < l; i++) {
        const arg = method[i];
        // shallow copy injection argument and override target
        copiedMethod[i] = createInjectionArg(arg.token, arg.options.useWrapper, target, key, i);
      }
      defArgs.methods[key] = copiedMethod;
    }
  }
}

function mergeCtorArgs(definedArgs: Array<InjectionArgument>, paramtypes: Array<Type>, target: Object): void {
  for (let i = 0, l = paramtypes.length; i < l; i++) {
    const param = paramtypes[i], definedArg = definedArgs[i];
    if (definedArg === undefined) {
      definedArgs[i] = createInjectionArg(param, undefined, target, undefined, i);
    }
  }
}

export function applyInjectionArg(
  token: Token,
  useWrapper: WrapperDef,
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
      const method = (args.methods[key as string] || (args.methods[key as string] = []));
      return method[index] = createInjectionArg(token, useWrapper, target, key, index);
    }
    return args.props[key as string] = createInjectionArg(token, useWrapper, target, key);
  }
  return args.ctor[index as number] = createInjectionArg(token, useWrapper, target, undefined, index as number);
}

export function createInjectionArg(token: Token, useWrapper: WrapperDef, target: Object, propertyKey?: string | symbol, index?: number, factory?: Function): InjectionArgument {
  return {
    token,
    options: {
      token,
      ctx: undefined,
      scope: Scope.DEFAULT,
      attrs: {},
      useWrapper,
    },
    meta: {
      target,
      propertyKey,
      index,
      factory,
    },
  }
}
