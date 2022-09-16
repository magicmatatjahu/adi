import { createSession, getProviderInstance, filterHooks, filterProviderDefinition, getTreeshakableProvider } from './metadata';
import { Session } from './session';
import { InstanceStatus, SessionFlag } from '../enums';
import { runHooks } from '../hooks';
import { NilInjectorError } from '../problem';
import { wait, waitAll, handleOnInitLifecycle } from '../utils';
import { destroy } from './garbage-collector';

import type { Injector } from './injector';
import type { ClassType, InjectionArgument, InjectionArguments, ProviderRecord, InjectionHook, ProviderInstance, ProviderDefinition } from '../interfaces';

const circularSessionsMetaKey = 'adi:circular-sessions';
const promiseResolveMetaKey = 'adi:promise-resolve';
const promiseDoneMetaKey = 'adi:promise-done';

export function inject<T>(injector: Injector, parentSession: Session | undefined, arg: InjectionArgument): T | undefined | Promise<T | undefined> {
  const session = createSession(arg.token, arg.metadata, injector, parentSession);
  parentSession && parentSession.children.push(session);
  return resolve(injector, session, arg.hooks);
}

export function injectArray(injector: Injector, session: Session, deps: Array<InjectionArgument>): Array<any> | Promise<Array<any>> {
  const args: Array<any> = [];
  for (let i = 0, l = deps.length; i < l; i++) {
    args.push(inject(injector, session, deps[i]));
  };
  return waitAll(args);
}

export function injectDictionary<T>(injector: Injector, session: Session, obj: T, properties: Record<string, InjectionArgument>): Array<void> | Promise<Array<void>> {
  const props = Object.keys(properties);
  props.push(...Object.getOwnPropertySymbols(properties) as any[]);
  const args: Array<any> = [];
  for (let i = 0, l = props.length; i < l; i++) {
    const prop = props[i];
    args.push(wait(
      inject(injector, session, properties[prop]),
      (value: any) => obj[prop] = value,
    ));
  }
  return waitAll(args);
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
    const instances: ProviderInstance[] = [];

    for (let i = 0, l = deps.length; i < l; i++) {
      if (args[i] === undefined && (methodDep = deps[i]) !== undefined) {
        actions.push(wait(
          inject(injector, session, methodDep),
          (result: { value: any, instance: ProviderInstance }) => {
            instances.push(result.instance);
            args[i] = result.value;
          }
        ));
      }
    }

    return waitAll(
      actions,
      () => wait(
        originalMethod.apply(this, args), 
        result => {
          destroy(instances);
          return result;
        },
      ),
    );
  }
}

export function resolverClass<T>(injector: Injector, session: Session, data: { useClass: ClassType, inject: InjectionArguments }): T | undefined | Promise<T | undefined> {
  return wait(
    injectArray(injector, session, data.inject.parameters),
    deps => {
      const instance = new data.useClass(...deps);
      injectMethods(injector, session, instance, data.inject.methods);
      return wait(
        injectDictionary(injector, session, instance, data.inject.properties),
        () => instance,
      );
    }
  ) as unknown as T;
}

export function resolverFactory<T>(injector: Injector, session: Session, data: { useFactory: (...args: any[]) => T | Promise<T>, inject: Array<InjectionArgument> }): T | undefined | Promise<T | undefined> {
  return wait(
    injectArray(injector, session, data.inject),
    deps => data.useFactory(...deps) as any,
  ) as unknown as T;
}

export function resolverValue<T>(_: Injector, __: Session, data: T): T {
  return data;
}

export function resolverFunction<T>(injector: Injector, session: Session, data: { useFunction: (...args: any[]) => T | Promise<T>, inject: Array<InjectionArgument> }, ...args: any[]): T | undefined | Promise<T | undefined> {
  return wait(
    injectArray(injector, session, data.inject),
    deps => data.useFunction(...args, ...deps) as any,
  ) as unknown as T;
}

export function resolve<T>(injector: Injector, session: Session, hooks: Array<InjectionHook> = []): T | undefined | Promise<T | undefined> {
  const filteredHooks = filterHooks(injector.hooks, session);
  filteredHooks.push(...hooks);
  return runHooks(hooks, session, resolveRecord);
}

export function resolveRecord<T>(session: Session): T | undefined | Promise<T | undefined> {
  const ctx = session.ctx;
  let record: ProviderRecord | Array<ProviderRecord> = ctx.record;
  if (record) {
    ctx.injector = record.host;
    return runHooks(filterHooks(record.hooks, session), session, resolveDefinition);
  }

  record = ctx.injector.providers.get(session.options.token);
  if (record === undefined) { // check provider in the parent injector
    record = ctx.record = getTreeshakableProvider(ctx.injector, session.options.token);
    if (record) { // resolved treeshakable provider
      return runHooks(filterHooks(record.hooks, session), session, resolveDefinition);
    }
    return resolveFromParent(session);
  }
  
  if (record.length === 1) { // only self provider, without imports
    record = ctx.record = record[0];
    if (record === null) { // treeshakable null fallback - check provider in the parent injector
      return resolveFromParent(session);
    }
    return runHooks(filterHooks(record.hooks, session), session, resolveDefinition);
  }

  if (record[0] === undefined) { // maybe treeshakable provider
    record[0] = getTreeshakableProvider(ctx.injector, session.options.token);
  }
  return resolveMultipleRecords(session, record, record[0] ? 0 : 1);
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
    factory.resolver(injector, session, factory.data),
    value => {
      if (instance.status & InstanceStatus.CIRCULAR) {
        value = Object.assign(instance.value, value);
      }
      instance.value = value;
      return wait(
        handleOnInitLifecycle(session, instance),
        () => {
          instance.status |= InstanceStatus.RESOLVED;
          // resolve pararell injections
          instance.meta[promiseResolveMetaKey]?.(instance.value); // fix place for that - it should be called at the end in some first hook
          return instance.value;
        }
      );
    }
  ) as unknown as T | Promise<T>;
}

function resolveMultipleRecords<T>(original: Session, records: Array<ProviderRecord>, index: number, defaultDef?: ProviderDefinition): T | undefined | Promise<T | undefined> {
  if (records.length === index) {
    return resolveFromParent(original);
  }

  const session = original.fork(); // fork session for every record
  const record = session.ctx.record = records[index];
  return runHooks(filterHooks(record.hooks, session), session, s => {
    const ctx = s.ctx;
    const def = filterProviderDefinition(ctx.record.defs, s);

    if (def === undefined) {
      if (records.length === ++index && defaultDef) {
        ctx.injector = (ctx.record = (ctx.def = defaultDef).record).host;
        return runHooks(defaultDef.hooks, s, resolveInstance);
      }
      return resolveMultipleRecords(original, records, index, defaultDef);
    }

    if (def.when) { // handle constrained definition
      ctx.injector = (ctx.record = (ctx.def = def).record).host;
      return runHooks(def.hooks, s, resolveInstance);
    }

    defaultDef = defaultDef || def;
    if (records.length === ++index && defaultDef) {
      ctx.injector = (ctx.record = (ctx.def = defaultDef).record).host;
      return runHooks(defaultDef.hooks, s, resolveInstance);
    }
    return resolveMultipleRecords(original, records, index, defaultDef);
  });
}

function resolveFromParent<T>(session: Session): T | Promise<T> {
  const ctx = session.ctx;
  const injector = ctx.injector = ctx.injector.parent;
  if (injector === null) {
    throw new NilInjectorError(session.options.token);
  }
  ctx.def = ctx.record = undefined;
  return resolveRecord(session);
}

function handleParallelInjection<T>(session: Session, instance: ProviderInstance<T>): T | Promise<T> {
  // check circular injection
  let tempSession = session;
  while (tempSession) {
    if (!tempSession) { // case when injection is performed by new injector.get() call - parallel injection
      break;
    }
    if (instance === (tempSession = tempSession.parent)?.ctx.instance) { // found circular references
      return handleCircularInjection(session, instance);
    }
  }
  // otherwise parallel injection detected (in async resolution)
  return instance.meta[promiseDoneMetaKey] || (instance.meta[promiseDoneMetaKey] = new Promise<T>(resolve => {
    instance.meta[promiseResolveMetaKey] = resolve;
  }));
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
  const circularSessions: Array<Session> = [];
  let doBreak = false, tempSession = session;
  while (tempSession) {
    if (instance === (tempSession = tempSession.parent)?.ctx.instance) { // found circular references
      doBreak = true;
    }

    tempSession.setFlag(SessionFlag.CIRCULAR);
    circularSessions.push(tempSession);

    if (doBreak === true) {
      let deeper = false;
      let deeperSession = tempSession;
      while (deeperSession?.parent?.hasFlag(SessionFlag.CIRCULAR)) { // case when circular references are deeper
        deeper = true;
        deeperSession = deeperSession.parent;
      }
      if (deeper) {
        const index = (deeperSession.meta[circularSessionsMetaKey] as any[]).indexOf(tempSession);
        deeperSession.meta[circularSessionsMetaKey].splice(index, 1, ...circularSessions);
      } else {
        tempSession.meta[circularSessionsMetaKey] = circularSessions;
      }
      break;
    } else if (tempSession.meta[circularSessionsMetaKey]) {
      tempSession.meta[circularSessionsMetaKey].pop(); // remove duplication of the last session - it is inside 'circularSessions'
      circularSessions.unshift(...tempSession.meta[circularSessionsMetaKey]);
      delete tempSession.meta[circularSessionsMetaKey];
    }
  }

  return instance.value = Object.create(proto); // create object from prototype (only classes)
}

function getPrototype<T>(instance: ProviderInstance<T>): Object {
  const provider = instance.def.provider;
  return typeof provider === 'function' ? provider.prototype : provider.useClass;
}
