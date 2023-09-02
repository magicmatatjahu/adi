import { Hook } from "./hook";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook, ScopeType } from '../types';

export function Tagged<NextValue>(tags: Array<string | symbol>) {
  return Hook(
    function taggedHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      session.inject.annotations.tagged = tags;
      return next(session);
    },
    { name: 'adi:tagged' }
  )
}
