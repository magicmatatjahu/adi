import { ADI_HOOK_DEF } from "../constants";

import type { Session } from "../injector/session";
import type { InjectionHook, InjectionHookDefinition } from "../interfaces";

export function createHook<T, F extends (...args: any) => InjectionHook<T>>(hook: F, options?: InjectionHookDefinition): (...args: Parameters<F>) => InjectionHook<T> {
  if (typeof options === 'object') {
    hook[ADI_HOOK_DEF] = options;
  }
  return hook;
}

export function runHooks(hooks: Array<InjectionHook>, session: Session) {
  function nextHook(session: Session, index: number) {
    return hooks[index](session, (s: Session) => nextHook(s, index+1));
  }
  return nextHook(session, 0);
}

export function filterHooks(hooks: Array<InjectionHook>, session: Session) {
  function nextHook(session: Session, index: number) {
    return hooks[index](session, (s: Session) => nextHook(s, index+1));
  }
  return nextHook(session, 0);
}
