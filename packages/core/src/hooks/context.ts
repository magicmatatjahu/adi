import { Hook } from "./hook";
import { Context } from '../injector/context';

import type { Session } from '../injector';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export function Ctx<NextValue>(context: Context | string | symbol) {
  return Hook(
    function contextHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      session.ctx = context instanceof Context ? context : Context.for(context);
      return next(session);
    },
    { name: 'adi:context' }
  )
}
