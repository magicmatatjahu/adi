import { Hook } from "./hook";
import { Context } from '../injector';
import { TransientScope, getScopeDefinition } from '../scopes';

import type { Session } from '../injector';
import type { InjectionHookResult, NextInjectionHook } from '../types';

const scopeDef = getScopeDefinition(TransientScope);

export function New<NextValue>(data?: Record<string, any>) {
  return Hook(
    function newHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      if (data) {
        session.inject.context = Context.create(data);
      }
      session.inject.scope = scopeDef;
      return next(session);
    },
    { name: 'adi:new' }
  )
}
