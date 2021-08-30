import { InjectorResolver, Session } from "../injector";
import { InstanceRecord, StandaloneOnInit } from "../interfaces";
import { InjectionStatus } from "../enums";
import { EMPTY_ARRAY, SESSION_INTERNAL } from "../constants";
import { hasOnInitHook } from "../utils";

function runHook(instance: InstanceRecord, session: Session) {
  const value = instance.value;
  hasOnInitHook(value) && value.onInit();
  const onInitHooks = (session[SESSION_INTERNAL.ON_INIT_HOOKS] || EMPTY_ARRAY) as StandaloneOnInit[];
  if (onInitHooks.length > 0) {
    const injector = instance.def.record.host;
    for (let i = onInitHooks.length - 1; i > -1; i--) {
      const hook = onInitHooks[i];
      if (typeof hook === 'function') {
        hook(value);
      } else {
        const factory = InjectorResolver.createFactory(hook.onInit, hook.inject);
        const newSession = session.copy();
        // add delegation
        newSession['$$delegate'] = {
          type: 'single',
          values: value,
        };
        factory(injector, newSession);
      }
    }
    delete session[SESSION_INTERNAL.ON_INIT_HOOKS];
  }
}

function handleCircular(instance: InstanceRecord, session: Session) {
  if (
    instance.status & InjectionStatus.CIRCULAR &&
    session[SESSION_INTERNAL.START_CIRCULAR] === instance
  ) {
    const circulars = session[SESSION_INTERNAL.CIRCULAR] as Session[];
    for (let i = 0, l = circulars.length; i < l; i++) {
      const circularSession = circulars[i];
      runHook(circularSession.instance, circularSession);
    }
    runHook(instance, session);
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
    handleCircular(instance, session);
  } else if (session.parent?.[SESSION_INTERNAL.CIRCULAR] === undefined) {
    runHook(instance, session);
  }
}
