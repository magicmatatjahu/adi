import { Hook } from '@adi/core';

import type { Session, InjectionHookResult, NextInjectionHook, InjectionItem, Injections } from '@adi/core';

export const OVERRIDE_KEY = 'adi:key:override';

export function Override<NextValue>(injections: Array<InjectionItem | undefined> | Injections) {  
  return Hook(
    function overrideHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      session.annotations[OVERRIDE_KEY] = injections;
      return next(session);
    },
    { name: 'adi:override' }
  )
}
