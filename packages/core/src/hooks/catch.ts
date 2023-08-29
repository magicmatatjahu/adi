import { createHook } from "./create-hook";
import { waitCallback, noopThen } from "../utils";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export const Catch = createHook(<CR>(catchFn: (error: unknown) => CR) => {
  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<ResultType | CR> => {
    return waitCallback(
      () => next(session),
      noopThen,
      err => {
        return catchFn(err);
      }
    );
  }
}, { name: 'adi:hook:catch' })
