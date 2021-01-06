import { resolver } from "../injector";
import { injectableMixin } from "../decorators";
import { Type, ProviderDef, InjectionArgument, InjectableOptions, MethodArgument } from "../interfaces"
import { DEFINITIONS } from "../constants";
import { InjectionFlags, ProviderDefFlags } from "../enums";
import { Scope } from "../scopes";
import { Token } from "../types";

export function getProviderDef<T>(provider: unknown): ProviderDef<T> | undefined {
  return provider[DEFINITIONS.PROVIDER] || undefined;
}

export function applyProviderDef<T>(target: Object, params: Array<any>, options: InjectableOptions = {}): ProviderDef<T> {
  const def = ensureProviderDef(target);
  if (options) {
    def.scope = options.scope || def.scope;
    def.providedIn = options.providedIn || def.providedIn;
    if (options.export === true) {
      def.flags |= ProviderDefFlags.EXPORT;
    }
  }
  inheritance(target, def, params);  
  def.factory = resolver.providerFactory(target as Type<any>, def);
  return def as ProviderDef<T>;
}

export function applyFactoryDef<T>(method: Object, token: Token, params: Array<any>, options: InjectableOptions = {}): ProviderDef<T> {
  const def = ensureProviderDef(method);
  def.token = token;
  if (options) {
    def.scope = options.scope || def.scope;
    def.providedIn = options.providedIn || def.providedIn;
    if (options.export === true) {
      def.flags |= ProviderDefFlags.EXPORT;
    }
  }
  mergeArgs(def.args.ctor, params, InjectionFlags.FACTORY, method);
  return def as ProviderDef<T>;
}

export function applyExtension<T>(extension: any, target: Object, key: string | symbol, indexOrDescriptor?: number | PropertyDescriptor): void {
  const arg = getInjectionArg(target, key, indexOrDescriptor);
}

function ensureProviderDef<T>(provider: T): ProviderDef<T> {
  if (!provider.hasOwnProperty(DEFINITIONS.PROVIDER)) {
    Object.defineProperty(provider, DEFINITIONS.PROVIDER, { value: defineProviderDef(provider), enumerable: true });
  }
  return provider[DEFINITIONS.PROVIDER];
}

function defineProviderDef<T>(provider: T): ProviderDef<T> {
  return {
    token: provider,
    factory: undefined,
    flags: ProviderDefFlags.NONE,
    scope: Scope.DEFAULT,
    labels: {},
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

  // when inheritedDef doesn't exist, then apply @Injectable() decorator or merge constructor params
  if (!inheritedDef) {
    mergeArgs(def.args.ctor, params, InjectionFlags.CONSTRUCTOR_PARAMETER, target);
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
  const symbols = Object.getOwnPropertySymbols(inheritedProps);
  for (let i = 0, l = symbols.length; i < l; i++) {
    const s = symbols[i] as unknown as string;
    props[s] = props[s] || inheritedProps[s];
  }

  const targetMethods = Object.getOwnPropertyNames((target as any).prototype);
  // override/adjust methods injection
  // check if target has method. If yes, user could make it injectable, or make override to pure (without injection) function in extended class
  for (let key in inheritedDefArgs.methods) {
    // TODO: copy array?
    if (!targetMethods.includes(key)) {
      defArgs.methods[key] = inheritedDefArgs.methods[key];
    }
  }

  // override/adjust constructor injection
  mergeArgs(def.args.ctor, params.length > 0 ? params : inheritedDefArgs.ctor, InjectionFlags.CONSTRUCTOR_PARAMETER, target);
  return;
}

export function mergeMethodParams(params: Array<any>, target: Object, key: string) {
  const t = target.constructor, args = ensureProviderDef(t).args;
  const deps = (args.methods[key as string] || (args.methods[key as string] = createMethodArg(target, key))).deps;
  mergeArgs(deps, params, InjectionFlags.METHOD_PARAMETER, t, key);
}

function mergeArgs(args: Array<InjectionArgument>, params: Array<any>, type: InjectionFlags, target: Object, key?: string | symbol): void {
  for (let i = 0, length = params.length; i < length; i++) {
    const param = params[i];
    const arg = args[i];
    if (arg === undefined) {
      args[i] = {
        token: param.token || param,
        options: param.options || createInjectionArg(type, target, key, i).options,
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
  const isNotStatic = (target as any).prototype === undefined;
  if (isNotStatic === true) {
    target = target.constructor;
  }
  let args = ensureProviderDef(target).args;

  if (key !== undefined) {
    if (typeof index === "number") {
      if (isNotStatic === true) {
        const method = (args.methods[key as string] || (args.methods[key as string] = createMethodArg(target, key))).deps;
        return method[index] || (method[index] = createInjectionArg(InjectionFlags.METHOD_PARAMETER, target, key, index));
      } else {
        args = ensureProviderDef(target[key]).args;
        return args.ctor[index] || (args.ctor[index] = createInjectionArg(InjectionFlags.FACTORY, target, key, index));
      }
    }
    return args.props[key as string] || (args.props[key as string] = createInjectionArg(InjectionFlags.PROPERTY, target, key));
  }
  return args.ctor[index as number] || (args.ctor[index as number] = createInjectionArg(InjectionFlags.CONSTRUCTOR_PARAMETER, target, key, index as number));
}

export function createInjectionArg(type: InjectionFlags, target: Object, propertyKey?: string | symbol, index?: number): InjectionArgument {
  return {
    token: undefined,
    options: {
      flags: type,
      def: undefined,
      ctx: undefined,
      scope: undefined,
      scopeParams: undefined,
      default: undefined,
      target,
      propertyKey,
      index,
      instance: undefined,
    },
  }
}

export function createMethodArg(target: Object, propertyKey?: string | symbol): MethodArgument {
  return {
    deps: [],
    target,
    propertyKey,
    instance: undefined,
  }
}
