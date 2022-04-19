import { ADI_HOOK_DEF } from "../constants";

import type { Session } from "../injector/session";
import type { InjectionHook, InjectionHookDefinition, NextHook } from "../interfaces";

export function createHook<T, F extends (...args: any) => InjectionHook<T>>(hook: F, options?: InjectionHookDefinition): (...args: Parameters<F>) => InjectionHook<T> {
  if (typeof options === 'object') {
    hook[ADI_HOOK_DEF] = options;
  }
  return hook;
}

export function runHooks(hooks: Array<InjectionHook>, session: Session, lastHook: NextHook) {
  if (hooks.length === 0) return lastHook(session);
  hooks = [...hooks, lastHook];
  return _runHooks(hooks, session, -1);
}

function _runHooks(hooks: Array<InjectionHook>, session: Session, index: number) {
  index++;
  return hooks[index](session, (s: Session) => _runHooks(hooks, s, index));
}
