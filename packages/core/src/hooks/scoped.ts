import { createHook } from "./create-hook";
import { getScopeDefinition } from "../scopes";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook, ScopeType } from '../types';

export const Scoped = createHook((scope: ScopeType) => {
  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<ResultType> => {
    session.inject.scope = getScopeDefinition(scope);
    return next(session);
  }
}, { name: 'adi:hook:scoped' });
