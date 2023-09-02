import { Hook } from "./hook";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export function Named<NextValue>(name: string | symbol | object) {
  return Hook(
    function namedHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      session.inject.annotations.named = name;
      return next(session);
    },
    { name: 'adi:named' }
  )
}
