import { createHook } from "./create-hook";

import type { Context, Session } from '../injector';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export const Ctx = createHook((context: Context) => {
  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<ResultType> => {
    session.inject.context = context;
    return next(session);
  }
}, { name: 'adi:hook:context' })
