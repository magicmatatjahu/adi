import { createHook } from "./hook";
import { createFunctionResolver } from '../injector';
import { destroyHooksMetaKey } from "../private";
import { wait } from "../utils";

import type { InjectionItem } from '../interfaces';

export interface OnDestroyHookOptions<T = any> {
  onDestroy: (value: T, ...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

function hasOnDestroyFunction(onDestroy: unknown): onDestroy is OnDestroyHookOptions {
  return typeof (onDestroy as OnDestroyHookOptions).onDestroy === 'function';
}

export const OnDestroyHook = createHook((hook: ((value: any) => void | Promise<void>) | OnDestroyHookOptions) => {
  let resolver: ReturnType<typeof createFunctionResolver>;
  if (hasOnDestroyFunction(hook)) {
    resolver = createFunctionResolver(hook.onDestroy, hook.inject);
  } else {
    resolver = (_, [value]) => hook(value);
  }

  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    return wait(
      next(session),
      value => {
        const instance = session.context.instance;
        const hooks = instance.meta[destroyHooksMetaKey] || (instance.meta[destroyHooksMetaKey] = []);
        hooks.push(resolver);
        return value;
      }
    );
  }
}, { name: 'adi:hook:on-destroy-hook' });