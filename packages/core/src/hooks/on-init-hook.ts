import { Hook } from './hook';
import { createFunction } from '../injector';
import { initHooksMetaKey } from "../private";
import { hasOnInitLifecycle } from "../utils";

import type { Session } from '../injector';
import type { InjectionItem, NextInjectionHook, InjectionHookResult } from '../types';

export interface OnInitHookOptions<T = any> {
  onInit: (value: T, ...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

export function OnInitHook<NextValue>(hook: ((value: NextValue) => void | Promise<void>) | OnInitHookOptions<NextValue>) {
  let resolver: ReturnType<typeof createFunction>;
  if (hasOnInitLifecycle(hook)) {
    resolver = createFunction(hook.onInit, { inject: (hook as OnInitHookOptions).inject });
  } else {
    resolver = createFunction(hook as (value: NextValue) => void | Promise<void>)
  }

  return Hook(
    function onInitHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      if (session.hasFlag('dry-run')) {
        return next(session);
      }
  
      const hooks = session.annotations[initHooksMetaKey] || (session.annotations[initHooksMetaKey] = []);
      hooks.push(resolver);
      return next(session);
    },
    { name: 'adi:on-init' }
  )
}
