import { createHook } from "./create-hook";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook, ScopeType } from '../types';

export const Tagged = createHook((tags: Array<string | symbol>) => {
  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<ResultType> => {
    session.inject.annotations.tagged = tags;
    return next(session);
  }
}, { name: 'adi:hook:tagged' });
