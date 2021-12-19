import { Injector } from "./injector";
import { Session } from "./session";
import { InjectionArgument, InjectionMetadata, FactoryDef, Type, InstanceRecord, InjectionArguments, InjectionItem, ModuleMetadata, FunctionInjections } from "../interfaces";
import { InjectionKind, InstanceStatus, SessionStatus } from "../enums";
import { Wrapper, thenable } from "../utils";
import { Token } from "../types";
import { InjectorMetadata } from "./metadata";
import { DELEGATION, SESSION_INTERNAL } from "../constants";
import { DestroyManager } from "./destroy-manager";
import { Delegate } from "..";

export const InjectorResolver = new class {
  inject<T>(injector: Injector, token: Token, wrapper: Wrapper | Array<Wrapper>, meta: InjectionMetadata, parentSession?: Session): T | undefined | Promise<T | undefined> {
    return injector.resolveToken(wrapper, Session.create(token, meta, parentSession));
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

  injectMethods<T>(instance: T, methods: Record<string, InjectionArgument[]>, injector: Injector, parentSession: Session): void {
    const isAsync = parentSession.status & SessionStatus.ASYNC;
    for (const name in methods) {
      const methodDeps = methods[name];
      const originalMethod = instance[name];
      const cachedDeps: any[] = [];

      instance[name] = (...args: any) => {
        let methodProp: InjectionArgument = undefined;
        let toRemove: InstanceRecord[];

        for (let i = 0, l = methodDeps.length; i < l; i++) {
          args[i] = args[i] || cachedDeps[i];
          if (args[i] === undefined && (methodProp = methodDeps[i]) !== undefined) {
            const argSession = Session.create(methodProp.token, methodProp.metadata, parentSession);
            const value = args[i] = injector.resolveToken(methodProp.wrapper, argSession);
            
            // if injection has side effects, then save instance record to destroy in the future, otherwise cache it
            if (argSession.status & SessionStatus.SIDE_EFFECTS) {
              (toRemove || (toRemove = [])).push(argSession.instance);
            } else {
              cachedDeps[i] = value;
            }
          }
        }
        
        return thenable(
          () => isAsync ? Promise.all(args).then(deps => originalMethod.apply(instance, deps)) : originalMethod.apply(instance, args),
          value => {
            DestroyManager.destroyAll(toRemove);
            return value;
          }
        );
      }
    }
  }

  createProviderFactory<T>(
    provider: Type<T>, 
    injections: InjectionArguments,
    imports?: ModuleMetadata['imports'],
    providers?: ModuleMetadata['providers'],
  ): FactoryDef<T> {
    let factory = (injector: Injector, session: Session) => {
      const deps = InjectorMetadata.combineDependencies(session.options.injections, injections, provider);
      if (session.status & SessionStatus.ASYNC) {
        return this.createProviderAsync(provider, injections, injector, session);
      }
      const instance = new provider(...this.injectDeps(deps.parameters, injector, session));
      this.injectProperties(instance, deps.properties, injector, session);
      this.injectMethods(instance, deps.methods, injector, session);
      return instance;
    }
    if (imports || providers) {
      factory = InjectorResolver.createInjectorFactory(factory, imports, providers);
    }
    return factory;
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

  createFunction<T>(
    fn: Function,
    options: FunctionInjections = {},
    withValue: boolean = false,
  ): FactoryDef<T> {
    let { inject = [], withDelegation, delegationKey } = options;
    if (withValue && !withDelegation) {
      inject = [Delegate(delegationKey || DELEGATION.DEFAULT), ...inject]
    }
    return this.createFactory(fn, inject, options.imports, options.providers);
  }

  createFactory<T>(
    fn: Function,
    injections: Array<InjectionItem>,
    imports?: ModuleMetadata['imports'],
    providers?: ModuleMetadata['providers'],
  ): FactoryDef<T> {
    const convertedDeps = InjectorMetadata.convertDependencies(injections, InjectionKind.FUNCTION, fn);
    let factory = (injector: Injector, session: Session) => {
      const deps = (InjectorMetadata.combineDependencies as any)(session.options.injections, convertedDeps, fn);
      return thenable(
        () => session.status & SessionStatus.ASYNC ? this.injectDepsAsync(deps, injector, session).then(args => fn(...args)) : fn(...this.injectDeps(deps, injector, session)),
        value => {
          DestroyManager.destroyAll(session.meta?.toDestroy);
          return value;
        }
      );
    }
    if (imports || providers) {
      factory = InjectorResolver.createInjectorFactory(factory, imports, providers);
    }
    return factory;
  }

  createInjectorFactory<T>(
    factory: FactoryDef<T>,
    imports?: ModuleMetadata['imports'],
    providers?: ModuleMetadata['providers'],
  ): FactoryDef<T> {
    return (injector: Injector, session: Session) => {
      return thenable(
        () => {
          injector = Injector.create({ imports, providers }, injector, { disableExporting: true });
          if (session.status & SessionStatus.ASYNC) {
            return injector.buildAsync();
          }
          return injector.build();
        },
        newInjector => {
          session.instance.meta.hostInjector = newInjector;
          return factory(newInjector, session) as any;
        },
      ) as unknown as T;
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
      return handleCircularInjection(instance, session);
    }

    // otherwise parallel injection detected (in async resolution)
    return instance.donePromise || applyParallelHook(instance);
  }
}

function applyParallelHook<T>(instance: InstanceRecord<T>) {
  return instance.donePromise = new Promise<T>(resolve => {
    instance.doneResolve = resolve;
  });
}

function handleCircularInjection<T>(instance: InstanceRecord<T>, session: Session): T {
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
  session.parent[SESSION_INTERNAL.CIRCULAR] = session.parent[SESSION_INTERNAL.CIRCULAR] || [];
  session.parent[SESSION_INTERNAL.START_CIRCULAR] = instance;
  return instance.value;
}
