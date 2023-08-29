import { createHook } from "./create-hook";
import { createFunction } from '../injector';
import { destroyHooksMetaKey } from "../private";
import { wait, hasOnDestroyLifecycle } from "../utils";

import type { Session } from '../injector';
import type { InjectionItem, NextInjectionHook, InjectionHookResult } from '../types';

export interface OnDestroyHookOptions<T = any> {
  onDestroy: (value: T, ...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

export const OnDestroyHook = createHook((hook: ((value: any) => void | Promise<void>) | OnDestroyHookOptions) => {
  let resolver: ReturnType<typeof createFunction>;
  if (hasOnDestroyLifecycle(hook)) {
    resolver = createFunction(hook.onDestroy, (hook as OnDestroyHookOptions).inject);
  } else {
    resolver = (_, [value]) => hook(value);
  }

  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<ResultType> => {
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
  }
}, { name: 'adi:hook:on-destroy-hook' });