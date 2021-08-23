import { Session } from "../injector";
import { InstanceRecord } from "../interfaces";
import { InjectionStatus } from "../enums";
import { CIRCULAR } from "../constants";
import { hasOnInitHook } from "../utils";

export function handleOnInit(instance: InstanceRecord, session: Session) {
  const value = instance.value;
  
  if (session[CIRCULAR.ANNOTATION]) {
    // when resolution chain has circular reference
    if (
      instance.status & InjectionStatus.CIRCULAR &&
      session[CIRCULAR.START_ANNOTATION] === value
    ) {
      // merge circular object
      // Object.assign(instance.value, value);
    
      const circulars = session[CIRCULAR.ANNOTATION];
      for (let i = 0, l = circulars.length; i < l; i++) {
        const circularValue = circulars[i];
        hasOnInitHook(circularValue) && circularValue.onInit();
      }
      hasOnInitHook(value) && value.onInit();
    } else if (session.parent) {
      if (Array.isArray(session.parent[CIRCULAR.ANNOTATION])) {
        session.parent[CIRCULAR.ANNOTATION] = [...session[CIRCULAR.ANNOTATION], value, ...session.parent[CIRCULAR.ANNOTATION]];
      } else {
        session.parent[CIRCULAR.ANNOTATION] = [...session[CIRCULAR.ANNOTATION], value];
      }
      session.parent[CIRCULAR.START_ANNOTATION] = session.parent[CIRCULAR.START_ANNOTATION] || session[CIRCULAR.START_ANNOTATION];
    }
  } else if (hasOnInitHook(value) && session.parent?.[CIRCULAR.ANNOTATION] === undefined) {
    value.onInit();
  }
}