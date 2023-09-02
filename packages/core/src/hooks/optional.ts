import { Hook } from "./hook";
import { NoProviderError } from "../problem";
import { waitCallback, noopThen } from "../utils";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export function Optional<NextValue, T = undefined>(value?: T) {
  return Hook(
    function optionalHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue | T> {
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
    },
    { name: 'adi:optional' }
  )
}
