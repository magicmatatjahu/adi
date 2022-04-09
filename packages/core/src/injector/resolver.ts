import { getProviderInstance, filterHooks, filterProviderDefinition } from './metadata';
import { Session } from './session';
import { InstanceStatus } from '../enums';
import { runHooks } from '../hooks';
import { thenable, thenableAll } from '../utils';

import type { Injector } from './injector';
import type { ClassType, InjectionArgument, InjectionArguments, ProviderToken, ProviderRecord, InjectionHook } from '../interfaces';

export function inject<T>(injector: Injector, parentSession: Session | undefined, { token, hooks, metadata }: InjectionArgument): T | undefined | Promise<T | undefined> {
  const session = new Session({ token, ctx: undefined, scope: undefined, annotations: {}, meta: {} }, { injector, record: undefined, def: undefined, instance: undefined }, metadata, parentSession);
  return resolve(injector, session, hooks);
}

export function injectArray(injector: Injector, session: Session, deps: Array<InjectionArgument>): Array<any | Promise<any>> {
  const args: Array<any> = [];
  for (let i = 0, l = deps.length; i < l; i++) {
    args.push(inject(injector, session, deps[i]));
  };
  return args;
}

export function injectDictionary<T>(injector: Injector, session: Session, obj: T, deps: Record<string, InjectionArgument>): Array<any | Promise<any>> {
  const props = Object.keys(deps);
  props.push(...Object.getOwnPropertySymbols(deps) as any[]);
  const args: Array<any> = [];
  for (const prop in props) {
    args.push(injectKey(injector, session, obj, prop, deps[prop]));
  }
  return args;
}

function injectKey<T>(injector: Injector, session: Session, obj: T, prop: string | symbol, dep: InjectionArgument): any {
  return thenable(
    () => inject(injector, session, dep),
    (value: any) => obj[prop] = value,
  );
}

// function injectMethods<T>(injector: Injector, session: Session, obj: T, prop: string | symbol, dep: InjectionArgument): any {
//   return thenable(
//     () => inject(injector, session, dep),
//     (value: any) => obj[prop] = value,
//   );
// }

export function factoryClass<T>(injector: Injector, session: Session, data: { classType: ClassType, inject: InjectionArguments }): T | undefined | Promise<T | undefined> {
  return thenable(
    () => injectArray(injector, session, data.inject.parameters),
    deps => {
      const instance = new data.classType(...deps);
      return thenable(
        () => thenableAll(injectDictionary(injector, session, instance, data.inject.properties)),
        () => instance,
      );
    }
  ) as unknown as T;
}

export function factoryFactory<T>(injector: Injector, session: Session, data: { useFactory: (...args: any[]) => T | Promise<T>, inject: Array<InjectionArgument> }): T | undefined | Promise<T | undefined> {
  return thenable(
    () => injectArray(injector, session, data.inject),
    deps => data.useFactory(...deps) as any,
  ) as unknown as T;
}

export function factoryValue<T>(_: Injector, __: Session, data: any): T | undefined | Promise<T | undefined> {
  return data;
}

export function resolve<T>(injector: Injector, session: Session, hooks: Array<InjectionHook> = []): T | undefined | Promise<T | undefined> {
  hooks = [...hooks, ...filterHooks(injector.hooks, session), resolveRecord];
  return runHooks(hooks, session);
}

export function resolveRecord<T>(session: Session): T | undefined | Promise<T | undefined> {
  const ctx = session.ctx;

  let record: ProviderRecord | Array<ProviderRecord> = getRecord(ctx.injector, session.options.token);
  if (record === undefined) { // check provider in the parent injector - reuse session
    ctx.injector = ctx.injector.parent;
    return resolveRecord(session);
  } else if (record.length === 1) { // only self provider
    record = ctx.record = record[0];
    const hooks = [...filterHooks(record.hooks, session), resolveDefinition];
    return runHooks(hooks, session);
  }

  return;
}

export function resolveDefinition<T>(session: Session): T | Promise<T> {
  const ctx = session.ctx;
  const def = ctx.def = filterProviderDefinition(ctx.record.defs, session);

  if (def === undefined) {
    ctx.injector = ctx.injector.parent;
    ctx.record = undefined;
    return resolveRecord(session);
  }

  ctx.injector = (ctx.record = def.record).host;
  return runHooks([...def.hooks, resolveInstance], session);
}

export function resolveInstance<T>(session: Session): T | Promise<T> {
  const ctx = session.ctx;
  const instance = ctx.instance = getProviderInstance<T>(session);
  if (instance.status & InstanceStatus.RESOLVED) {
    return instance.value;
  }

  // // parallel or circular injection
  // if (instance.status > InstanceStatus.UNKNOWN) {
  //   return handleParallelInjection(instance, session) as T;
  // }

  const { def: { factory }, injector } = ctx;
  return thenable(
    () => factory.factory(injector, session, factory.data),
    value => {
      if (instance.status & InstanceStatus.CIRCULAR) {
        value = Object.assign(instance.value, value);
      }
      instance.value = value;
      return thenable(
        // () => handleOnInit(instance, session),
        () => {
          instance.status |= InstanceStatus.RESOLVED;
          return instance.value;
        }
      );
    }
  ) as unknown as T;
}

function getRecord(injector: Injector, token: ProviderToken): Array<ProviderRecord> | undefined {
  return injector.providers.get(token);
}
