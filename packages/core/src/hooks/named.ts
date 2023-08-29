import { createHook } from "./create-hook";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export const Named = createHook((name: string | symbol | object) => {
  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<ResultType> => {
    session.inject.annotations.named = name;
    return next(session);
  }
}, { name: 'adi:hook:named' });
