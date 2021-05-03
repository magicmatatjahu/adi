import { InjectableOptions, InjectionArgument, ProviderDef, Type } from "../interfaces";
import { InjectorResolver } from "../injector/resolver";
import { Scope } from "../scope";
import { Reflection } from "../utils";

export function Injectable(options?: InjectableOptions) {
  return function(target: Object) {
    const params = Reflection.getOwnMetadata("design:paramtypes", target);
    applyProviderDef(target, params, options);
  }
}

export function injectableMixin<T>(clazz: Type<T>): Type<T> {
  Injectable()(clazz);
  return clazz;
}

export function getProviderDef<T>(provider: unknown): ProviderDef<T> | undefined {
  return provider['$$prov'] || undefined;
}

export function applyProviderDef<T>(target: Object, params: Array<any>, options?: InjectableOptions): ProviderDef<T> {
  const def = ensureProviderDef(target);
  if (options) {
    def.providedIn = options.providedIn || def.providedIn;
    def.scope = options.scope || def.scope;
  }
  inheritance(target, def, params);  
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
function inheritance(target: Object, def: ProviderDef, params: any[] = []): void {
  let inheritedClass = Object.getPrototypeOf(target);
  // case when base class is not decorated by @Injectable()
  if (inheritedClass && inheritedClass.length > 0) {
    inheritedClass = injectableMixin(inheritedClass);
  }
  let inheritedDef = getProviderDef(inheritedClass);

  // when inheritedDef doesn't exist, then merge constructor params
  if (!inheritedDef) {
    mergeArgs(def.args.ctor, params, target);
    return;
  }

  const defArgs = def.args;
  const inheritedDefArgs = inheritedDef.args;

  // override/adjust properties injection
  const props = defArgs.props;
  const inheritedProps = inheritedDefArgs.props;
  for (let key in inheritedProps) {
    props[key] = props[key] || inheritedProps[key];
  }

  // const symbols = Object.getOwnPropertySymbols(inheritedProps);
  // for (let i = 0, l = symbols.length; i < l; i++) {
  //   const s = symbols[i] as unknown as string;
  //   props[s] = props[s] || inheritedProps[s];
  // }

  mergeArgs(def.args.ctor, params, target);
}

function mergeArgs(args: Array<InjectionArgument>, params: Array<any>, target: Object, key?: string | symbol): void {
  for (let i = 0, l = params.length; i < l; i++) {
    const param = params[i];
    const arg = args[i];
    if (arg === undefined) {
      args[i] = {
        token: param.token || param,
        options: param.options || createInjectionArg(target, key, i).options,
      }
    } else {
      arg.token = arg.token || param.token || param; // @Inject() has higher priority
    }
  }
}

export function getInjectionArg(
  target: Object,
  key?: string | symbol,
  index?: number | PropertyDescriptor,
): InjectionArgument {
  if (key !== undefined) {
    target = target.constructor;
  }
  let args = ensureProviderDef(target).args;

  // if (key !== undefined) {
  //   if (typeof index === "number") {
  //     if (isNotStatic === true) {
  //       const method = (args.methods[key as string] || (args.methods[key as string] = createMethodArg(target, key))).deps;
  //       return method[index] || (method[index] = createInjectionArg(InjectionFlags.METHOD_PARAMETER, target, key, index));
  //     } else {
  //       args = ensureProviderDef(target[key]).args;
  //       return args.ctor[index] || (args.ctor[index] = createInjectionArg(InjectionFlags.FACTORY, target, key, index));
  //     }
  //   }
  //   return args.props[key as string] || (args.props[key as string] = createInjectionArg(InjectionFlags.PROPERTY, target, key));
  // }
  return args.ctor[index as number] || (args.ctor[index as number] = createInjectionArg(target, key, index as number));
}

export function createInjectionArg(target: Object, propertyKey?: string | symbol, index?: number): InjectionArgument {
  return {
    token: undefined,
    options: {
      ctx: undefined,
      scope: Scope.DEFAULT,
      target,
      propertyKey,
      index,
      instance: undefined,
    },
  }
}
