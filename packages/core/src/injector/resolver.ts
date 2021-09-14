import { Injector } from "./injector";
import { Session } from "./session";
import { InjectionArgument, InjectionMetadata, FactoryDef, Type, InstanceRecord, InjectionArguments, InjectionItem } from "../interfaces";
import { InstanceStatus, SessionStatus } from "../enums";
import { thenable, Wrapper } from "../utils";
import { Token } from "../types";
import { InjectorMetadata } from "./metadata";
import { SESSION_INTERNAL } from "../constants";
import { DestroyManager } from "./destroy-manager";

export const InjectorResolver = new class {
  inject<T>(injector: Injector, token: Token, wrapper: Wrapper, meta: InjectionMetadata, parentSession?: Session): T | undefined | Promise<T | undefined> {
    const options = InjectorMetadata.createOptions(token);
    const newSession = new Session(undefined, undefined, undefined, options, meta, parentSession);
    return injector.resolveToken(wrapper, newSession);
  }

  injectDeps(deps: Array<InjectionArgument>, injector: Injector, session: Session): Array<any> {
    const args: Array<any> = [];
    for (let i = 0, l = deps.length; i < l; i++) {
      const arg = deps[i];
      args.push(this.inject(injector, arg.token, arg.wrapper, arg.metadata, session));
    };
    return args;
  }

  injectDepsAsync(deps: Array<InjectionArgument>, injector: Injector, session: Session): Promise<any[]> {
    const args: Array<Promise<any>> = [];
    for (let i = 0, l = deps.length; i < l; i++) {
      const arg = deps[i];
      args.push(this.inject(injector, arg.token, arg.wrapper, arg.metadata, session));
    };
    return Promise.all(args);
  }

  injectProperty<T>(instance: T, propName: string | symbol, prop: InjectionArgument, injector: Injector, session: Session): void {
    instance[propName] = this.inject(injector, prop.token, prop.wrapper, prop.metadata, session);
  }

  injectProperties<T>(instance: T, props: Record<string, InjectionArgument>, injector: Injector, session: Session): void {
    for (const propName in props) {
      this.injectProperty(instance, propName, props[propName], injector, session);
    }
    // inject to symbols
    for (const sb of Object.getOwnPropertySymbols(props)) {
      this.injectProperty(instance, sb, props[sb as any as string], injector, session);
    }
  }

  async injectPropertyAsync<T>(instance: T, propName: string | symbol, prop: InjectionArgument, injector: Injector, session: Session): Promise<void> {
    instance[propName] = await this.inject(injector, prop.token, prop.wrapper, prop.metadata, session);
  }

  injectPropertiesAsync<T>(instance: T, props: Record<string, InjectionArgument>, injector: Injector, session: Session): Promise<void> {
    const args: Array<Promise<void>> = [];
    for (const propName in props) {
      args.push(this.injectPropertyAsync(instance, propName, props[propName], injector, session));
    }
    // inject to symbols
    for (const sb of Object.getOwnPropertySymbols(props)) {
      args.push(this.injectPropertyAsync(instance, sb, props[sb as any as string], injector, session));
    }
    return Promise.all(args) as unknown as Promise<void>;
  }

  injectMethodArgument<T>(injector: Injector, token: Token, wrapper: Wrapper, meta: InjectionMetadata, parentSession?: Session): { value: T | undefined | Promise<T | undefined>, session: Session } {
    const options = InjectorMetadata.createOptions(token);
    const newSession = new Session(undefined, undefined, undefined, options, meta, parentSession);
    return { value: injector.resolveToken(wrapper, newSession), session: newSession };
  }

  injectMethods<T>(instance: T, methods: Record<string, InjectionArgument[]>, injector: Injector, parentSession: Session): void {
    const isAsync = parentSession.status & SessionStatus.ASYNC;
    for (const name in methods) {
      const methodDeps = methods[name];
      const originalMethod = instance[name];
      const cachedDeps: Array<{ value: any }> = [];

      instance[name] = (...args: any) => {
        let methodProp: InjectionArgument = undefined;
        let toRemove: InstanceRecord[];

        for (let i = 0, l = methodDeps.length; i < l; i++) {
          if (args[i] === undefined && (methodProp = methodDeps[i]) !== undefined) {
            if (cachedDeps[i] !== undefined) {
              args[i] = cachedDeps[i].value;
            } else {
              const injected = this.injectMethodArgument(injector, methodProp.token, methodProp.wrapper, methodProp.metadata, parentSession);
              args[i] = injected.value;
              // if injection has side effects, then save instance record to destroy in the future, otherwise cache it
              if (injected.session.status & SessionStatus.SIDE_EFFECTS) {
                (toRemove || (toRemove = [])).push(injected.session.instance);
              } else {
                // cache also falsy values 
                cachedDeps[i] = { value: injected.value };
              }
            }
          }
        }

        const result = isAsync ? Promise.all(args).then(deps => originalMethod.apply(instance, deps)) : originalMethod.apply(instance, args);
        return thenable(
          () => result,
          value => {
            DestroyManager.destroyAll('default', toRemove, injector);
            return value;
          }
        );
      }
    }
  }

  createProviderFactory<T>(
    provider: Type<T>, 
    injections: InjectionArguments,
  ): FactoryDef<T> {    
    return (injector: Injector, session: Session) => {
      const deps = InjectorMetadata.combineDependencies(session.options.injections, injections, provider);
      if (session.status & SessionStatus.ASYNC) {
        return this.createProviderAsync(provider, injections, injector, session);
      }
      const instance = new provider(...this.injectDeps(deps.parameters, injector, session));
      this.injectProperties(instance, deps.properties, injector, session);
      this.injectMethods(instance, deps.methods, injector, session);
      return instance;
    }
  }

  async createProviderAsync<T>(
    provider: Type<T>,
    injections: InjectionArguments,
    injector: Injector,
    session: Session,
  ) {
    const instance = new provider(...await this.injectDepsAsync(injections.parameters, injector, session));
    await this.injectPropertiesAsync(instance, injections.properties, injector, session);
    this.injectMethods(instance, injections.methods, injector, session);
    return instance;
  }

  createFactory(
    factory: Function,
    deps: Array<InjectionItem>,
  ) {
    const convertedDeps = InjectorMetadata.convertDependencies(deps, factory);
    return (injector: Injector, session: Session) => {
      if (session.status & SessionStatus.ASYNC) {
        return this.injectDepsAsync(convertedDeps, injector, session).then(args => factory(...args));
      }
      return factory(...this.injectDeps(convertedDeps, injector, session));
    }
  }

  handleParallelInjection<T>(instance: InstanceRecord<T>, session: Session): T | Promise<T> {
    let tempSession = session, isCircular: boolean = false;

    // check circular injection
    while (tempSession) {
      tempSession = tempSession.parent;
      if (instance === tempSession?.instance) {
        isCircular = true;
        break;
      }
    }

    // if circular injection detected then handle it
    if (isCircular === true) {
      return handleCircularRefs(instance, session);
    }

    // parallel injection detected (in async resolution)
    return instance.donePromise || applyParallelHook(instance);
  }
}

function applyParallelHook<T>(instance: InstanceRecord<T>) {
  return instance.donePromise = new Promise<T>(resolve => {
    instance.doneResolve = resolve;
  });
}

function handleCircularRefs<T>(instance: InstanceRecord<T>, session: Session): T {
  // if circular injection detected return empty prototype instance
  if (instance.status & InstanceStatus.CIRCULAR) {
    return instance.value;
  }
  instance.status |= InstanceStatus.CIRCULAR;
  
  const proto = instance.def.proto;
  if (!proto) {
    throw new Error("Circular Dependency");
  }

  // add flag that resolution session has circular reference. 
  // `OnInitHook` wrapper will handle later this flag to run `onInit` hook in proper order 
  instance.value = Object.create(proto);
  session.parent[SESSION_INTERNAL.CIRCULAR] = session.parent[SESSION_INTERNAL.CIRCULAR] || true;
  session.parent[SESSION_INTERNAL.START_CIRCULAR] = instance;
  return instance.value;
}
