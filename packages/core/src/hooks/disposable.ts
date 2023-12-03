import { Hook } from "./hook";
import { applyDisposableMethods } from "../injector/lifecycle-manager";
import { wait } from "../utils";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export type DisposableType<T> = T & Disposable & AsyncDisposable;

export function Disposable<NextValue>() {
  return Hook(
    function disposableHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<DisposableType<NextValue>> {
      if (session.hasFlag('dry-run')) {
        return next(session) as any;
      }

      return wait(
        next(session),
        value => {
          if (typeof value === 'object' && value) {
            applyDisposableMethods(value, session.instance);
          }
          return value as NextValue & Disposable & AsyncDisposable;
        }
      );
    },
    { name: 'adi:disposable' }
  )
}
