import { Hook } from "./hook";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export function Namespaced<NextValue>(namespace: string | symbol | object) {
  return Hook(
    function namespacedHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      session.annotations.namespace = namespace;
      return next(session);
    },
    { name: 'adi:namespaced' }
  )
}
