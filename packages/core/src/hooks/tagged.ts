import { Hook } from "./hook";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export function Tagged<NextValue>(tags: Array<string | symbol>) {
  return Hook(
    function taggedHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      const currentTags = session.annotations.tags || [];
      currentTags.push(...tags);
      return next(session);
    },
    { name: 'adi:tagged' }
  )
}
