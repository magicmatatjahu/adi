import { Injector } from "./injector";
import { InjectionStatus, InjectionFlags } from "../enums";
import { 
  ContextRecord, InjectionArgument, InjectionOptions,
  ProviderDef, FactoryDef, InquirerDef, Type, 
  ConstructorArguments, PropertiesArguments, MethodsArguments,
} from "../interfaces";
import { resolveForwardRef, hasOnInitHook } from "../utils";
import { Token } from "../types";

import { getNilInjector } from "./factories";
import { InjectorImpl } from "./implementation";

function createProxyHandler<P>(params: P) {
  return {
    get(target: any, propKey: string | symbol | number) {
      const prop = target[propKey];
      if (typeof prop === "function") {
        return () => prop.apply(this.$$proxy, arguments);
      }
      // patch inline and deep `this` - actually it's not supported
      // console.log(prop === target)
      // if (prop === target) {
      //   return this.$$proxy;
      // }
      // case with undefined/null/false/0/""
      if (params.hasOwnProperty(propKey)) {
        return params[propKey];
      }
      return prop;
    },
    $$proxy: undefined, 
  };
}

function createProxy<T extends object, P = any>(obj: T, params: P): T {
  const handler = createProxyHandler<P>(params);
  return handler.$$proxy = new Proxy<T>(obj, handler);
}

export const CIRCULAR_DATA = {
  is: false,
  ctx: new Set<ContextRecord>(),
  onInit: new Set<ContextRecord>(),
}

export class Resolver {
  inject<T>(token: Token<T>, options: InjectionOptions, injector: Injector, inquirer?: InquirerDef, sync?: boolean): Promise<T | undefined> | T | undefined {
    return injector.resolve(token, options, inquirer, sync);
  }

  async injectDepsAsync(deps: Array<InjectionArgument>, injector: Injector, inquirer: InquirerDef): Promise<Array<[]>> {
    const args: Array<any> = [];
    for (let i = 0, l = deps.length; i < l; i++) {
      const arg = deps[i];
      args.push(await injector.resolve(resolveForwardRef(arg.token), arg.options, inquirer));
    };
    return args;
  }

  injectDepsSync(deps: Array<InjectionArgument>, injector: Injector, inquirer: InquirerDef): Array<any> {
    const args: Array<any> = [];
    for (let i = 0, l = deps.length; i < l; i++) {
      const arg = deps[i];
      args.push(injector.resolveSync(resolveForwardRef(arg.token), arg.options, inquirer));
    };
    return args;
  }

  injectDeps(deps: Array<InjectionArgument>, injector: Injector, inquirer?: InquirerDef, sync?: boolean): Promise<Array<any>> | Array<any> {
    if (sync === true) {
      return this.injectDepsSync(deps, injector, inquirer);
    } else {
      return this.injectDepsAsync(deps, injector, inquirer);
    }
  }

  async injectClassAsync<T>(classRef: Type<T>, deps: Array<InjectionArgument>, injector: Injector, inquirer?: InquirerDef): Promise<T> {
    return new (classRef)(...await resolver.injectDeps(deps, injector, inquirer));
  }

  injectClassSync<T>(classRef: Type<T>, deps: Array<InjectionArgument>, injector: Injector, inquirer?: InquirerDef): T {
    return new (classRef)(...resolver.injectDepsSync(deps, injector, inquirer));
  }

  injectClass<T>(classRef: Type<T>, deps: Array<InjectionArgument>, injector: Injector, inquirer?: InquirerDef, sync?: boolean): Promise<T> | T {
    if (sync === true) {
      return this.injectClassSync(classRef, deps, injector, inquirer);
    } else {
      return this.injectClassAsync(classRef, deps, injector, inquirer);
    }
  }

  async injectFactoryAsync<T>(factory: (...args: any) => T, deps: Array<InjectionArgument>, injector: Injector, inquirer?: InquirerDef): Promise<T> {
    return factory(...await resolver.injectDeps(deps, injector, inquirer));
  }

  injectFactorySync<T>(factory: (...args: any) => T, deps: Array<InjectionArgument>, injector: Injector, inquirer?: InquirerDef): T {
    return factory(...resolver.injectDepsSync(deps, injector, inquirer));
  }

  injectFactory<T>(factory: (...args: any) => T, deps: Array<InjectionArgument>, injector: Injector, inquirer?: InquirerDef, sync?: boolean): Promise<T> | T {
    if (sync === true) {
      return this.injectFactorySync(factory, deps, injector, inquirer);
    } else {
      return this.injectFactoryAsync(factory, deps, injector, inquirer);
    }
  }

  async injectProps<T>(instance: T, props: PropertiesArguments, injector: Injector, inquirer?: InquirerDef): Promise<void> {
    for (const name in props) {
      const prop = props[name];
      if (prop.options.flags & InjectionFlags.LAZY) {
        this.injectLazy(instance, name, prop, injector, inquirer);
      } else {
        instance[name] = await injector.resolve(prop.token, { ...prop.options, instance }, inquirer); 
      }
    }
    for (const s of Object.getOwnPropertySymbols(props)) {
      const prop = props[s as any as string];
      if (prop.options.flags & InjectionFlags.LAZY) {
        this.injectLazy(instance, s, prop, injector, inquirer);
      } else {
        instance[s] = await injector.resolve(prop.token, { ...prop.options, instance }, inquirer); 
      }
    }
  }

  injectPropsSync<T>(instance: T, props: PropertiesArguments, injector: Injector, inquirer?: InquirerDef): void {
    for (const name in props) {
      const prop = props[name];
      if (prop.options.flags & InjectionFlags.LAZY) {
        this.injectLazy(instance, name, prop, injector, inquirer);
      } else {
        instance[name] = injector.resolveSync(prop.token, { ...prop.options, instance }, inquirer);
      }
    }
    for (const s of Object.getOwnPropertySymbols(props)) {
      const prop = props[s as any as string];
      if (prop.options.flags & InjectionFlags.LAZY) {
        this.injectLazy(instance, s, prop, injector, inquirer);
      } else {
        instance[s] = injector.resolveSync(prop.token, { ...prop.options, instance }, inquirer);
      }
    }
  }

  // TODO: optimize it
  injectMethods<T>(instance: T, methods: MethodsArguments, injector: Injector, inquirer?: InquirerDef): void {
    for (const name in methods) {
      const method = methods[name], methodDeps = method.deps;
      const originalMethod = instance[name];

      instance[name] = async (...args: any) => {
        let methodProp = undefined;
        for (let i = 0, l = methodDeps.length; i < l; i++) {
          if (args[i] === undefined && (methodProp = methodDeps[i])) {
            args[i] = await injector.resolve(methodProp.token, { ...methodProp.options, instance, }, inquirer);
          }
        }
        return originalMethod.apply(instance, args);
      }
    }
  }

  providerFactory<T>(provider: Type<T>, def: ProviderDef, ctorDeps?: ConstructorArguments): FactoryDef<T> {
    const deps = ctorDeps || def.args.ctor,
      props = def.args.props,
      methods = def.args.methods;
    
    return (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => {
      if (sync === true) {
        return this.injectProviderSync(provider, deps, props, methods, injector, inquirer);
      } else {
        return this.injectProviderAsync(provider, deps, props, methods, injector, inquirer);
      }
    }
  }

  async injectProviderAsync<T>(
    provider: Type<T>, ctorDeps: ConstructorArguments, props: PropertiesArguments, methods: MethodsArguments,
    injector: Injector, inquirer: InquirerDef, 
  ): Promise<T> {
    const instance = new provider(...await this.injectDepsAsync(ctorDeps, injector, inquirer));
    await this.injectProps(instance, props, injector, inquirer);
    this.injectMethods(instance, methods, injector, inquirer);
    return instance;
  }

  injectProviderSync<T>(
    provider: Type<T>, ctorDeps: ConstructorArguments, props: PropertiesArguments, methods: MethodsArguments,
    injector: Injector, inquirer: InquirerDef, 
  ): T {
    const instance = new provider(...this.injectDepsSync(ctorDeps, injector, inquirer));
    this.injectPropsSync(instance, props, injector, inquirer);
    this.injectMethods(instance, methods, injector, inquirer);
    return instance;
  }

  handleResolutionCheck<T>(
    injector: InjectorImpl,
    token: Token<T>,
    options?: InjectionOptions,
    inquirer?: InquirerDef,
    sync?: boolean
  ): Promise<T | undefined> | T | undefined {
    const flags = options.flags;
    if (flags & InjectionFlags.NO_INJECT) {
      return undefined;
    } else {
      // SELF and SKIP_SELF case
      return resolver.handleSelfFlags(injector, token, options, inquirer, sync);
    }
  }

  handleSelfFlags<T>(injector: InjectorImpl, token: Token<T>, options?: InjectionOptions, inquirer?: InquirerDef, sync?: boolean): Promise<T | undefined> | T | undefined {
    // first load record if token has tree-shakable definition
    injector.retrieveRecord(token);
    let flags = options.flags;
    const nilInjector = getNilInjector();

    if (flags & InjectionFlags.SKIP_SELF) {
      if (flags & InjectionFlags.SELF) {
        return nilInjector.resolve(token, options);
      }

      // SkipSelf case
      flags &= ~InjectionFlags.SKIP_SELF;
      let parentInjector = injector.getParentInjector() as InjectorImpl;
      const ownRecord = injector.ownRecords.get(token);

      while (parentInjector !== nilInjector) {
        if (
          parentInjector.ownRecords.get(token) ||
          parentInjector.importedRecords.get(token) !== ownRecord
        ) {
          return parentInjector.resolve(token, { ...options, flags }, inquirer, sync);
        }
        parentInjector = parentInjector.getParentInjector() as InjectorImpl;
      }
      return nilInjector.resolve(token, options);
    }

    // Self case
    // if ownRecords has given token, then ADI has 100% sure that Self will be resolved in proper way, otherwise run NilInjector
    if (injector.ownRecords.get(token)) {
      flags &= ~InjectionFlags.SELF;
      return injector.resolve(token, { ...options, flags }, inquirer, sync);
    }
    return nilInjector.resolve(token, options);
  }

  injectLazy<T>(instance: T, name: string | symbol, prop: InjectionArgument, injector: Injector, inquirer?: InquirerDef): void {
    let value = undefined, isSet = false;
    Object.defineProperty(instance, name, {
      configurable: true,
      enumerable: true,
      get() {
        if (isSet === true) {
          return value;
        }
        isSet = true;
        return value = injector.resolveSync(prop.token, { ...prop.options, instance }, inquirer);
      },
      set(newValue: any) {
        isSet === true;
        value = newValue;
      }
    })
  }

  handleCircularDeps<T>(ctx: ContextRecord<T>): T {
    if (!(ctx.status & InjectionStatus.CIRCULAR)) {
      // make placeholder instance by prototype for circular deps
      // circular deps between useFactory provider and class isn't support - it cannot be resolved
      const proto = ctx && ctx.def.prototype;
      if (!proto) {
        throw new Error("Circular Dependency");
      }
      ctx.value = Object.create(proto);
      ctx.status |= InjectionStatus.CIRCULAR;
    }
    CIRCULAR_DATA.is = true;
    CIRCULAR_DATA.ctx.add(ctx);
    return ctx.value;
  }

  async handleCircularOnInit(): Promise<void> {
    for (const ctx of CIRCULAR_DATA.onInit) {
      const value = ctx.value;
      // TODO: think how to handle in different way onInit - it also fires on factory providers etc 
      hasOnInitHook(value, ctx.def.type) && await value.onInit();
    }
    CIRCULAR_DATA.onInit.clear();
  }

  handleCircularOnInitSync(): void {
    for (const ctx of CIRCULAR_DATA.onInit) {
      const value = ctx.value;
      // TODO: think how to handle in different way onInit - it also fires on factory providers etc 
      hasOnInitHook(value, ctx.def.type) && value.onInit();
    }
    CIRCULAR_DATA.onInit.clear();
  }
}

export const resolver = new Resolver();
