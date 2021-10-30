import { Session } from "../injector";
import { FactoryDef, InstanceRecord } from "../interfaces";
import { InjectionKind, InstanceStatus } from "../enums";
import { EMPTY_ARRAY, SESSION_INTERNAL, DELEGATION } from "../constants";
import { hasOnInitHook } from ".";
import { hasOnDestroyHook } from "./guards";

function runInitHook(instance: InstanceRecord, session: Session) {
  const value = instance.value;
  hasOnInitHook(value) && value.onInit();

  const onInitHooks = (session[SESSION_INTERNAL.ON_INIT_HOOKS] || EMPTY_ARRAY) as FactoryDef[];
  if (onInitHooks.length === 0) return;

  const injector = instance.def.record.host;
  for (let i = onInitHooks.length - 1; i > -1; i--) {
    const newSession = session.fork();
    // add delegation
    newSession[DELEGATION.KEY] = {
      type: 'single',
      values: value,
    };
    onInitHooks[i](injector, newSession);
  }
  delete session[SESSION_INTERNAL.ON_INIT_HOOKS];
}

function handleOnInitCircular(instance: InstanceRecord, session: Session) {
  if (
    instance.status & InstanceStatus.CIRCULAR &&
    session[SESSION_INTERNAL.START_CIRCULAR] === instance
  ) {
    const circulars = session[SESSION_INTERNAL.CIRCULAR] as Session[];
    for (let i = 0, l = circulars.length; i < l; i++) {
      const circularSession = circulars[i];
      runInitHook(circularSession.instance, circularSession);
    }
    runInitHook(instance, session);
  } else if (session.parent) {
    if (Array.isArray(session.parent[SESSION_INTERNAL.CIRCULAR])) {
      session.parent[SESSION_INTERNAL.CIRCULAR] = [...session[SESSION_INTERNAL.CIRCULAR], session, ...session.parent[SESSION_INTERNAL.CIRCULAR]];
    } else {
      session.parent[SESSION_INTERNAL.CIRCULAR] = [...session[SESSION_INTERNAL.CIRCULAR], session];
    }
    session.parent[SESSION_INTERNAL.START_CIRCULAR] = session.parent[SESSION_INTERNAL.START_CIRCULAR] || session[SESSION_INTERNAL.START_CIRCULAR];
  }
}

export function handleOnInit(instance: InstanceRecord, session: Session) {  
  if (session[SESSION_INTERNAL.CIRCULAR]) { // when resolution chain has circular reference
    handleOnInitCircular(instance, session);
  } else if (session.parent?.[SESSION_INTERNAL.CIRCULAR] === undefined) {
    runInitHook(instance, session);
  }
}

export async function handleOnDestroy(instance: InstanceRecord) {  
  const value = instance.value;
  hasOnDestroyHook(value) && await value.onDestroy();

  const onDestroyHooks = ((instance as any).destroyHooks || EMPTY_ARRAY) as FactoryDef[];
  if (onDestroyHooks.length === 0) return;

  const def = instance.def;
  const record = def.record;
  const injector = record.host;

  // run first last to last - in the order of when they were added
  for (let i = 0, l = onDestroyHooks.length; i < l; i++) {
    const factory = onDestroyHooks[i];
    const session = new Session(record, def, instance, { token: record.token }, { target: factory, kind: InjectionKind.STANDALONE }, undefined);
    // add delegation
    session[DELEGATION.KEY] = {
      type: 'single',
      values: value,
    };
    await factory(injector, session);
  }
  delete (instance as any).destroyHooks;
}
