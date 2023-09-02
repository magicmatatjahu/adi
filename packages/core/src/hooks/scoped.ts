import { Hook } from "./hook";
import { getScopeDefinition } from "../scopes";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook, ScopeType } from '../types';

export function Scoped<NextValue>(scope: ScopeType) {
  return Hook(
    function scopedHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      session.inject.scope = getScopeDefinition(scope);
      return next(session);
    },
    { name: 'adi:scoped' }
  )
}
