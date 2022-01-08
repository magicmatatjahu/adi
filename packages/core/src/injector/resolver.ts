import { Injector } from "./injector";
import { Session } from "./session";
import { InjectionArgument, InjectionMetadata, FactoryDef, FunctionDef, Type, InstanceRecord, InjectionArguments, InjectionItem, InjectionMethod, ModuleMetadata, FunctionInjections } from "../interfaces";
import { InjectionKind, InstanceStatus, SessionStatus } from "../enums";
import { Wrapper, thenable } from "../utils";
import { Token } from "../types";
import { SESSION_INTERNAL } from "../constants";
import { DestroyManager } from "./destroy-manager";
import { injectExtensions } from "./extensions";

import { convertDependencies, combineDependencies } from "./metadata";

export const InjectorResolver = new class {
  inject<T>(injector: Injector, token: Token, wrapper: Wrapper | Array<Wrapper>, metadata: InjectionMetadata, parentSession?: Session): T | undefined | Promise<T | undefined> {
    return injector.resolveToken(wrapper, Session.create(token, metadata, parentSession));
  }

  injectDeps(deps: Array<InjectionArgument>, injector: Injector, session: Session, async?: false): Array<any>;
  injectDeps(deps: Array<InjectionArgument>, injector: Injector, session: Session, async?: true): Promise<Array<any>>;
  injectDeps(deps: Array<InjectionArgument>, injector: Injector, session: Session, async: boolean = false): Array<any> | Promise<Array<any>> {
    const args: Array<any> = [];
    for (let i = 0, l = deps.length; i < l; i++) {
      const arg = deps[i];
      args.push(this.inject(injector, arg.token, arg.wrapper, arg.metadata, session));
    };
    return async ? Promise.all(args) : args;
  }

  injectProperty<T>(instance: T, prop: string | symbol, arg: InjectionArgument, injector: Injector, session: Session): any {
    return thenable(
      () => this.inject(injector, arg.token, arg.wrapper, arg.metadata, session),
      value => instance[prop] = value,
    );
  }

  injectProperties<T>(instance: T, props: Record<string, InjectionArgument>, injector: Injector, session: Session, async?: false): void;
  injectProperties<T>(instance: T, props: Record<string, InjectionArgument>, injector: Injector, session: Session, async?: true): Promise<void>;
  injectProperties<T>(instance: T, props: Record<string, InjectionArgument>, injector: Injector, session: Session, async: boolean = false): void | Promise<void> {
    const args: Array<any> = [];
    for (const propName in props) {
      args.push(this.injectProperty(instance, propName, props[propName], injector, session));
    }
    // inject to symbols
    for (const sb of Object.getOwnPropertySymbols(props)) {
      args.push(this.injectProperty(instance, sb, props[sb as any as string], injector, session));
    }
    return (async ? Promise.all(args) : args) as unknown as void;
  }

  injectMethods<T>(provider: Type<T>, instance: T, methods: Record<string, InjectionMethod>, injector: Injector, parentSession: Session): void {
    for (const methodName in methods) {
      const method = methods[methodName];
      if (method.injections.length) {
        instance[methodName] = injectMethod(
          instance[methodName],
          method.injections,
          injector,
          parentSession,
        );
      }
      injectExtensions(provider, instance, methodName, method, injector, parentSession);
    }
  }

  createProviderFactory<T>(
    provider: Type<T>, 
    injections: InjectionArguments,
    imports?: ModuleMetadata['imports'],
    providers?: ModuleMetadata['providers'],
  ): FactoryDef<T> {
    let factory = (injector: Injector, session: Session) => {
      const deps = combineDependencies(session.options.injections, injections, provider);
      if (session.status & SessionStatus.ASYNC) {
        return this.createProviderAsync(provider, injections, injector, session);
      }
      const instance = new provider(...this.injectDeps(deps.parameters, injector, session, false));
      this.injectProperties(instance, deps.properties, injector, session, false);
      this.injectMethods(provider, instance, deps.methods, injector, session);
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
    const instance = new provider(...await this.injectDeps(injections.parameters, injector, session, true));
    await this.injectProperties(instance, injections.properties, injector, session, true);
    this.injectMethods(provider, instance, injections.methods, injector, session);
    return instance;
  }

  createFactory<T>(
    fn: Function,
    injections: Array<InjectionItem>,
    imports?: ModuleMetadata['imports'],
    providers?: ModuleMetadata['providers'],
  ): FactoryDef<T> {
    const convertedDeps = convertDependencies(injections, InjectionKind.FACTORY, fn);
    let factory = (injector: Injector, session: Session) => {
      // @ts-ignore
      const deps = combineDependencies(session.options.injections, convertedDeps, fn, InjectionKind.FACTORY);
      const isAsync = session.status & SessionStatus.ASYNC;
      return thenable(
        () => isAsync ? this.injectDeps(deps, injector, session, true).then(args => fn(...args)) : fn(...this.injectDeps(deps, injector, session, false)),
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

  createFunction<T>(
    fn: Function,
    options: FunctionInjections = {},
  ): FunctionDef<T> {
    const { inject, imports, providers } = options;
    const convertedDeps = convertDependencies(inject || [], InjectionKind.FUNCTION, fn);
    let injectedFn = injectFunction<T>(fn, convertedDeps);
    if (imports || providers) {
      injectedFn = InjectorResolver.createInjectorFactory(injectedFn, imports, providers);
    }
    return injectedFn;
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
          return session.status & SessionStatus.ASYNC ? injector.buildAsync() : injector.build();
        },
        newInjector => {
          // TODO: atm in Decorate and Transform wrapper it is saved to the previous one instance in session. It should be saved in different place in normal injection and in standalone factory injection and injector should be destroyed
          session.instance.meta.hostInjector = newInjector;
          return factory(newInjector, session) as any;
        },
      ) as unknown as T;
    }
  }
}

function injectFunction<T>(
  fn: Function,
  injections: InjectionArgument[],
): FunctionDef<T> {
  const cachedDeps: any[] = [];
  let withSideEffects: boolean = true;
  return function func(injector: Injector, session: Session, ...args: any[]) {
    // @ts-ignore
    const deps = combineDependencies(session.options.injections, injections, fn, InjectionKind.FUNCTION);
    const isAsync = session.status & SessionStatus.ASYNC;

    if (withSideEffects === false) {
      return isAsync ? Promise.all(cachedDeps).then(injected => fn(...args, ...injected)) : fn(...args, ...cachedDeps);
    }

    let toRemove: InstanceRecord[];
    const values: any[] = [];

    for (let i = 0, l = deps.length; i < l; i++) {
      if (values[i] = cachedDeps[i]) continue;
      const injectionArg = deps[i];
      const argSession = Session.create(injectionArg.token, injectionArg.metadata, session);
      const value = values[i] = injector.resolveToken(injectionArg.wrapper, argSession);

      // if injection has side effects, then save instance record to destroy in the future, otherwise cache it
      if (argSession.status & SessionStatus.SIDE_EFFECTS) {
        (toRemove || (toRemove = [])).push(argSession.instance);
      } else {
        cachedDeps[i] = value;
      }
    }

    return thenable(
      () => isAsync ? Promise.all(values).then(injected => fn(...args, ...injected)) : fn(...args, ...values),
      value => {
        if (toRemove) DestroyManager.destroyAll(toRemove);
        else withSideEffects = false;
        return value;
      }
    );
  }
}

function injectMethod<T>(
  originalMethod: Function,
  injections: InjectionArgument[],
  injector: Injector,
  parentSession: Session,
) {
  const isAsync = (parentSession.status & SessionStatus.ASYNC) > 0;
  const cachedDeps: any[] = [];
  return function fn(this: T, ...args: any[]) {
    let methodProp: InjectionArgument = undefined;
    let toRemove: InstanceRecord[];

    for (let i = 0, l = injections.length; i < l; i++) {
      args[i] = args[i] || cachedDeps[i];
      if (args[i] === undefined && (methodProp = injections[i]) !== undefined) {
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
      () => isAsync ? Promise.all(args).then(deps => originalMethod.apply(this, deps)) : originalMethod.apply(this, args),
      value => {
        DestroyManager.destroyAll(toRemove);
        return value;
      }
    );
  }
}

export function handleParallelInjection<T>(instance: InstanceRecord<T>, session: Session): T | Promise<T> {
  // check circular injection
  let tempSession = session
  while (tempSession) {
    tempSession = tempSession.parent;
    if (instance === tempSession?.instance) {
      return handleCircularInjection(instance, session)
    }
  }

  // otherwise parallel injection detected (in async resolution)
  return instance.donePromise || applyParallelHook(instance);
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
