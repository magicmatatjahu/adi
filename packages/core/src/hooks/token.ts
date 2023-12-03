import { Hook } from "./hook";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook, ProviderToken } from '../types';

export function Token<NextValue, T>(token: ProviderToken<T>) {
  return Hook(
    function tokenHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<T> {
      session.token = token;
      return next(session) as T;
    },
    { name: 'adi:token' }
  )
}
