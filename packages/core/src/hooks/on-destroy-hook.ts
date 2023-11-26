import { Hook } from "./hook";
import { wait } from "../utils";

import type { Session } from '../injector';
import type { OnDestroyOptions, NextInjectionHook, InjectionHookResult } from '../types';

export function OnDestroyHook<NextValue>(hook: ((value: NextValue) => void | Promise<void>) | OnDestroyOptions<NextValue>) {
  return Hook(
    function onDestroyHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      if (session.hasFlag('dry-run')) {
        return next(session);
      }
  
      return wait(
        next(session),
        value => {
          const instance = session.instance;
          if (instance) {
            instance.onDestroy(hook)
          }
          return value;
        }
      );
    },
    { name: 'adi:on-destroy' }
  )
}
