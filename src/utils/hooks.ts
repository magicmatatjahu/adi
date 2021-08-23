import { Session } from "../injector";
import { InstanceRecord, StandaloneOnInit } from "../interfaces";
import { InjectionStatus } from "../enums";
import { EMPTY_ARRAY, SESSION_INTERNAL } from "../constants";
import { hasOnInitHook } from "../utils";

function handleCircular(instance: InstanceRecord, session: Session) {
  const value = instance.value;
  if (
    instance.status & InjectionStatus.CIRCULAR &&
    session[SESSION_INTERNAL.START_CIRCULAR] === instance
  ) {
    // merge circular object
    // Object.assign(instance.value, value);
  
    const circulars = session[SESSION_INTERNAL.CIRCULAR] as InstanceRecord[];
    for (let i = 0, l = circulars.length; i < l; i++) {
      const circularInstance = circulars[i];
      const circularValue = circularInstance.value;
      hasOnInitHook(circularValue) && circularValue.onInit();
    }
    hasOnInitHook(value) && value.onInit();
  } else if (session.parent) {
    if (Array.isArray(session.parent[SESSION_INTERNAL.CIRCULAR])) {
      session.parent[SESSION_INTERNAL.CIRCULAR] = [...session[SESSION_INTERNAL.CIRCULAR], instance, ...session.parent[SESSION_INTERNAL.CIRCULAR]];
    } else {
      session.parent[SESSION_INTERNAL.CIRCULAR] = [...session[SESSION_INTERNAL.CIRCULAR], instance];
    }
    session.parent[SESSION_INTERNAL.START_CIRCULAR] = session.parent[SESSION_INTERNAL.START_CIRCULAR] || session[SESSION_INTERNAL.START_CIRCULAR];
  }
}

export function handleOnInit(instance: InstanceRecord, session: Session) {
  const value = instance.value;
  
  if (session[SESSION_INTERNAL.CIRCULAR]) { // when resolution chain has circular reference
    handleCircular(instance, session);
  } else if (session.parent?.[SESSION_INTERNAL.CIRCULAR] === undefined) {
    hasOnInitHook(value) && value.onInit();
    const onInitHooks = session[SESSION_INTERNAL.ON_INIT_HOOKS] as StandaloneOnInit[] || EMPTY_ARRAY;
    if (onInitHooks.length > 0) {
      for (let i = onInitHooks.length - 1; i > -1; i--) {
        onInitHooks[i](value);
      }
      delete session[SESSION_INTERNAL.ON_INIT_HOOKS];
    }
  }
}
