import { createHook } from './create-hook';
import { createFunction } from '../injector';
import { initHooksMetaKey } from "../private";
import { hasOnInitLifecycle } from "../utils";

import type { Session } from '../injector';
import type { InjectionItem, NextInjectionHook, InjectionHookResult } from '../types';

export interface OnInitHookOptions<T = any> {
  onInit: (value: T, ...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

export const OnInitHook = createHook((hook: ((value: any) => void | Promise<void>) | OnInitHookOptions) => {
  let resolver: ReturnType<typeof createFunction>;
  if (hasOnInitLifecycle(hook)) {
    resolver = createFunction(hook.onInit, (hook as OnInitHookOptions).inject);
  } else {
    resolver = (_, [value]) => hook(value);
  }

  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<ResultType> => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    const hooks = session.annotations[initHooksMetaKey] || (session.annotations[initHooksMetaKey] = []);
    hooks.push(resolver);
    return next(session);
  }
}, { name: 'adi:hook:on-init-hook' });
