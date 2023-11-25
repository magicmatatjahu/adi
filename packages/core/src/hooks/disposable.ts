import { Hook } from "./hook";
import { applyDisposableInterfaces } from "../injector/lifecycle-manager";
import { wait } from "../utils";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export type DisposableType<T> = T & Disposable & AsyncDisposable;

export function Disposable<NextValue>() {
  return Hook(
    function disposableHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<DisposableType<NextValue>> {
      return wait(
        next(session),
        value => {
          if (typeof value === 'object' && value) {
            applyDisposableInterfaces(value, session.instance);
          }
          return value as NextValue & Disposable & AsyncDisposable;
        }
      );
    },
    { name: 'adi:disposable' }
  )
}
