import { Hook } from "./hook";
import { destroy as destroyFn } from "../injector";
import { wait } from "../utils";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export type DestroyableType<T> = {
  value: T;
  destroy: () => Promise<void>;
} & Disposable & AsyncDisposable;

export function Destroyable<NextValue>() {
  return Hook(
    function destroyableHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<DestroyableType<NextValue>> {
      if (session.hasFlag('dry-run')) {
        return next(session) as any;
      }

      return wait(
        next(session),
        value => {
          session.setFlag('side-effect');
          const destroy = () => destroyFn(session.instance, { event: 'manually' });

          return {
            value,
            destroy,
            [Symbol.dispose]: destroy,
            [Symbol.asyncDispose]: destroy,
          }
        }
      );
    },
    { name: 'adi:destroyable' }
  )
}
