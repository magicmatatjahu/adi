import { Session } from "../injector";
import { InstanceRecord } from "../interfaces";
import { InjectionKind, InstanceStatus, SessionStatus } from "../enums";
import { SESSION_INTERNAL } from "../constants";
import { hasOnInitHook } from ".";
import { hasOnDestroyHook } from "./guards";

function runInitHook(instance: InstanceRecord, session: Session) {
  if (session.status & SessionStatus.ASYNC) {
    return runInitHookAsync(instance, session);
  }

  const value = instance.value;
  hasOnInitHook(value) && value.onInit();
  if (!session.meta.initHooks) return;

  const hooks = session.meta.initHooks;
  const injector = instance.def.record.host;
  for (let i = hooks.length - 1; i > -1; i--) {
    const hook = hooks[i];
    const newSession = session.fork();
    hook(injector, newSession, value);
  }
  delete session.meta.initHooks;
}

async function runInitHookAsync(instance: InstanceRecord, session: Session) {
  const value = instance.value;
  hasOnInitHook(value) && await value.onInit();
  if (!session.meta.initHooks) return;

  const hooks = session.meta.initHooks;
  const injector = instance.def.record.host;
  for (let i = hooks.length - 1; i > -1; i--) {
    const hook = hooks[i];
    const newSession = session.fork();
    await hook(injector, newSession, value);
  }
  delete session.meta.initHooks;
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
    return handleOnInitCircular(instance, session);
  } else if (session.parent?.[SESSION_INTERNAL.CIRCULAR] === undefined) {
    return runInitHook(instance, session);
  }
}

export async function handleOnDestroy(instance: InstanceRecord) {  
  const value = instance.value;
  hasOnDestroyHook(value) && await value.onDestroy();
  if (!instance.meta.destroyHooks) return;

  const hooks = instance.meta.destroyHooks;
  const def = instance.def;
  const record = def.record;
  const injector = record.host;

  // run first last to last - in the order of when they were added
  for (let i = 0, l = hooks.length; i < l; i++) {
    const hook = hooks[i];
    const session = new Session(record, def, instance, { token: record.token }, { target: undefined, handler: hook.onDestroy, kind: InjectionKind.STANDALONE }, undefined);
    await hook(injector, session, value);
  }
  delete instance.meta.destroyHooks;
}
