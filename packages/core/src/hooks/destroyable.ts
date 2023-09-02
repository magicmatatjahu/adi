import { Hook } from "./hook";
import { destroy } from "../injector";
import { wait } from "../utils";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export type DestroyableType<T> = {
  value: T;
  destroy: () => Promise<void>;
}

export function Destroyable<NextValue>() {
  return Hook(
    function destroyableHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<DestroyableType<NextValue>> {
      return wait(
        next(session),
        value => {
          session.setFlag('side-effect');
          return {
            value,
            destroy: () => destroy(session.context.instance!, { event: 'manually' }),
          }
        }
      );
    },
    { name: 'adi:destroyable' }
  )
}
