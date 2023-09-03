import { Hook } from './hook';
import { createCustomResolver } from '../injector';
import { initHooksMetaKey } from "../private";
import { hasOnInitLifecycle } from "../utils";

import type { Session } from '../injector';
import type { InjectionItem, NextInjectionHook, InjectionHookResult, CustomResolver } from '../types';

export interface OnInitHookOptions<T = any> {
  onInit: (value: T, ...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

export function OnInitHook<NextValue>(hookOrOptions: ((value: NextValue) => void | Promise<void>) | OnInitHookOptions<NextValue>) {
  let resolver: CustomResolver;
  if (hasOnInitLifecycle(hookOrOptions)) {
    resolver = createCustomResolver({ kind: 'function', handler: hookOrOptions.onInit, inject: (hookOrOptions as OnInitHookOptions).inject });
  } else {
    resolver = createCustomResolver({ kind: 'function', handler: hookOrOptions as (value: NextValue) => void | Promise<void> })
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
