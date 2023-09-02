import { Hook } from "./hook";

import type { Context, Session } from '../injector';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export function Ctx<NextValue>(context: Context) {
  return Hook(
    function ctxHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      session.inject.context = context;
      return next(session);
    },
    { name: 'adi:context' }
  )
}
