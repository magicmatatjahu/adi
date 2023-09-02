import { Hook } from "./hook";
import { waitCallback, noopThen } from "../utils";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export function Catch<NextValue, CR>(catchFn: (error: unknown) => CR) {
  return Hook(
    function catchHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue | CR> {
      return waitCallback(
        () => next(session),
        noopThen,
        catchFn,
      );
    },
    { name: 'adi:catch' }
  )
}
