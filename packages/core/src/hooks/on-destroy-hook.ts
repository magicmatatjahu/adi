import { Hook } from "./hook";
import { createFunction } from '../injector';
import { destroyHooksMetaKey } from "../private";
import { wait, hasOnDestroyLifecycle } from "../utils";

import type { Session } from '../injector';
import type { InjectionItem, NextInjectionHook, InjectionHookResult } from '../types';

export interface OnDestroyHookOptions<T = any> {
  onDestroy: (value: T, ...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

export function OnDestroyHook<NextValue>(hook: ((value: NextValue) => void | Promise<void>) | OnDestroyHookOptions<NextValue>) {
  let resolver: ReturnType<typeof createFunction>;
  if (hasOnDestroyLifecycle(hook)) {
    resolver = createFunction(hook.onDestroy, { inject: (hook as OnDestroyHookOptions).inject });
  } else {
    resolver = createFunction(hook as (value: NextValue) => void | Promise<void>)
  }

  return Hook(
    function onDestroyHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      if (session.hasFlag('dry-run')) {
        return next(session);
      }
  
      return wait(
        next(session),
        value => {
          const instance = session.context.instance!;
          const hooks = instance.meta[destroyHooksMetaKey] || (instance.meta[destroyHooksMetaKey] = []);
          hooks.push(resolver);
          return value;
        }
      );
    },
    { name: 'adi:on-destroy' }
  )
}
