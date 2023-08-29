import { createHook } from "./create-hook";
import { NoProviderError } from "../problem";
import { waitCallback, noopThen } from "../utils";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export const Optional = createHook(<IT = undefined>(value?: IT) => {
  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<ResultType | IT> => {
    return waitCallback(
      () => next(session),
      noopThen,
      err => {
        if (err instanceof NoProviderError) {
          return value;
        }
        throw err;
      }
    );
  }
}, { name: 'adi:hook:optional' })
