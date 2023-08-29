import { createHook } from "./create-hook";
import { destroy } from "../injector";
import { wait } from "../utils";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export type DestroyableType<T> = {
  value: T;
  destroy: () => Promise<void>;
}

export const Destroyable = createHook(() => {
  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<DestroyableType<ResultType>> => {
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
  }
}, { name: 'adi:hook:destroyable' });
