import { createHook } from "./create-hook";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook, ProviderToken } from '../types';

export const Token = createHook(<RT>(token: ProviderToken<RT>) => {
  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<RT> => {
    session.inject.token = token;
    return next(session) as RT;
  }
}, { name: 'adi:hook:token' })