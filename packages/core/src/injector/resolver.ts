import { createSession, getProviderInstance, filterHooks, filterProviderDefinition } from './metadata';
import { Session } from './session';
import { InstanceStatus, SessionFlag } from '../enums';
import { runHooks } from '../hooks';
import { NilInjectorError } from '../problem';
import { wait, waitAll } from '../utils';

import type { Injector } from './injector';
import type { ClassType, InjectionArgument, InjectionArguments, ProviderToken, ProviderRecord, InjectionHook, ProviderInstance, ProviderDefinition } from '../interfaces';
import { handleOnInitLifecycle } from '../utils/lifecycle-hooks';

export function inject<T>(injector: Injector, parentSession: Session | undefined, arg: InjectionArgument): T | undefined | Promise<T | undefined> {
  const session = createSession(arg.token, arg.metadata, injector, parentSession);
  return resolve(injector, session, arg.hooks);
}

export function injectArray(injector: Injector, session: Session, deps: Array<InjectionArgument>): Array<any | Promise<any>> {
  const args: Array<any> = [];
  for (let i = 0, l = deps.length; i < l; i++) {
    args.push(inject(injector, session, deps[i]));
  };
  return args;
}

export function injectDictionary<T>(injector: Injector, session: Session, obj: T, properties: Record<string, InjectionArgument>): Array<any | Promise<any>> {
  const props = Object.keys(properties);
  props.push(...Object.getOwnPropertySymbols(properties) as any[]);
  const args: Array<any> = [];
  for (let i = 0, l = props.length; i < l; i++) {
    const prop = props[i];
    args.push(injectKey(injector, session, obj, prop, properties[prop]));
  }
  return args;
}

function injectKey<T>(injector: Injector, session: Session, obj: T, prop: string | symbol, dep: InjectionArgument): any {
  return wait(
    () => inject(injector, session, dep),
    (value: any) => obj[prop] = value,
  );
}

function injectMethods<T>(injector: Injector, session: Session, obj: T, methods: Record<string, Array<InjectionArgument>>): any {
  for (const methodName in methods) {
    const deps = methods[methodName];
    if (deps.length) {
      obj[methodName] = injectMethod(injector, session, obj[methodName], deps);
    }
  };
}

// TODO: Optimize it by cacheDeps like in previous implementation
function injectMethod<T>(injector: Injector, session: Session, originalMethod: Function, deps: Array<InjectionArgument>): any {
  return function(this: T, ...args: any[]) {
    let methodDep: InjectionArgument = undefined;
    const actions: any[] = [];

    for (let i = 0, l = deps.length; i < l; i++) {
      if (args[i] === undefined && (methodDep = deps[i]) !== undefined) {
        actions.push(wait(
          inject(injector, session, methodDep),
          value => args[i] = value,
        ));
      }
    }

    return waitAll(
      actions,
      () => wait(originalMethod.apply(this, args)),
    );
  }
}

export function factoryClass<T>(injector: Injector, session: Session, data: { classType: ClassType, inject: InjectionArguments }): T | undefined | Promise<T | undefined> {
  return wait(
    () => injectArray(injector, session, data.inject.parameters),
    deps => {
      const instance = new data.classType(...deps);
      injectMethods(injector, session, instance, data.inject.methods);
      return wait(
        () => waitAll(injectDictionary(injector, session, instance, data.inject.properties)),
        () => instance,
      );
    }
  ) as unknown as T;
}

export function factoryFactory<T>(injector: Injector, session: Session, data: { useFactory: (...args: any[]) => T | Promise<T>, inject: Array<InjectionArgument> }): T | undefined | Promise<T | undefined> {
  return wait(
    () => injectArray(injector, session, data.inject),
    deps => data.useFactory(...deps) as any,
  ) as unknown as T;
}

export function factoryValue<T>(_: Injector, __: Session, data: any): T | undefined | Promise<T | undefined> {
  return data;
}

export function resolve<T>(injector: Injector, session: Session, hooks: Array<InjectionHook> = []): T | undefined | Promise<T | undefined> {
  hooks = [...hooks, ...filterHooks(injector.hooks, session)];
  return runHooks(hooks, session, resolveRecord);
}

export function resolveRecord<T>(session: Session): T | undefined | Promise<T | undefined> {
  const ctx = session.ctx;
  let record: ProviderRecord | Array<ProviderRecord> = ctx.record;
  if (record) {
    ctx.injector = record.host;
    return runHooks(filterHooks(record.hooks, session), session, resolveDefinition);
  }

  record = getRecord(ctx.injector, session.options.token);
  if (record === undefined) { // check provider in the parent injector - reuse session
    return resolveFromParent(session);
  } else if (record.length === 1) { // only self provider
    record = ctx.record = record[0];
    return runHooks(filterHooks(record.hooks, session), session, resolveDefinition);
  }

  return;
}

export function resolveDefinition<T>(session: Session): T | Promise<T> {
  const ctx = session.ctx;
  let def: ProviderDefinition = ctx.def;
  if (def) {
    ctx.injector = (ctx.record = def.record).host;
    return runHooks(def.hooks, session, resolveInstance);
  }
  
  def = ctx.def = filterProviderDefinition(ctx.record.defs, session);
  if (def === undefined) {
    return resolveFromParent(session);
  }

  ctx.injector = (ctx.record = def.record).host;
  return runHooks(def.hooks, session, resolveInstance);
}

export function resolveInstance<T>(session: Session): T | Promise<T> {
  // check dry run
  if (session.hasFlag(SessionFlag.DRY_RUN)) {
    return;
  }
  
  const ctx = session.ctx;
  const instance = ctx.instance = getProviderInstance<T>(session);
  if (instance.status & InstanceStatus.RESOLVED) {
    return instance.value;
  }

  // parallel or circular injection
  if (instance.status > InstanceStatus.UNKNOWN) {
    return handleParallelInjection(session, instance);
  }

  instance.status |= InstanceStatus.PENDING;
  const { def: { factory }, injector } = ctx;
  return wait(
    () => factory.factory(injector, session, factory.data),
    value => {
      if (instance.status & InstanceStatus.CIRCULAR) {
        value = Object.assign(instance.value, value);
      }
      instance.value = value;
      return handleOnInitLifecycle(instance, () => {
        instance.status |= InstanceStatus.RESOLVED;
        return instance.value;
      });
    }
  ) as unknown as T | Promise<T>;
}

function resolveFromParent<T>(session: Session): T | Promise<T> {
  const ctx = session.ctx;
  ctx.def = ctx.record = undefined;
  const injector = ctx.injector = ctx.injector.parent;
  if (injector === null) {
    throw new NilInjectorError(session.options.token);
  }
  return resolveRecord(session);
}

function getRecord(injector: Injector, token: ProviderToken): Array<ProviderRecord> | undefined {
  return injector.providers.get(token);
}

function handleParallelInjection<T>(session: Session, instance: ProviderInstance<T>): T | Promise<T> {
  // check circular injection
  let tempSession = session;
  while (tempSession) {
    if (instance === (tempSession = tempSession.parent)?.ctx.instance) {
      return handleCircularInjection(session, instance);
    }
  }
  // otherwise parallel injection detected (in async resolution)
  return instance.meta.promiseDone || applyParallelHook(instance);
}

function handleCircularInjection<T>(session: Session, instance: ProviderInstance<T>): T {
  // if circular injection detected return empty prototype instance
  if (instance.status & InstanceStatus.CIRCULAR) {
    return instance.value;
  }

  const proto = getPrototype(instance);
  if (!proto) {
    throw new Error("Circular Dependency");
  }

  instance.status |= InstanceStatus.CIRCULAR;
  while (session) {
    session.setFlag(SessionFlag.CIRCULAR);
    if (instance === (session = session.parent)?.ctx.instance) {
      break;
    }
  }
  
  // TODO: Save circular instance to the cache and resolve in proper order resolution of chain
  instance.value = Object.create(proto);
  return instance.value;
}

function getPrototype<T>(instance: ProviderInstance<T>): Object {
  const provider = instance.def.provider;
  return typeof provider === 'function' ? provider.prototype : provider.useClass;
}

function applyParallelHook<T>(instance: ProviderInstance<T>) {
  return instance.meta.promiseDone = new Promise<T>(resolve => {
    instance.meta.promiseResolve = resolve;
  });
}
