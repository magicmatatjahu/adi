import { createHook } from './hook';
import { createFunction } from '../injector';
import { initHooksMetaKey } from "../private";

import type { InjectionItem } from '../interfaces';

export interface OnInitHookOptions<T = any> {
  onInit: (value: T, ...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

function hasOnInitFunction(onInit: unknown): onInit is OnInitHookOptions {
  return typeof (onInit as OnInitHookOptions).onInit === 'function';
}

export const OnInitHook = createHook((hook: ((value: any) => void | Promise<void>) | OnInitHookOptions) => {
  let resolver: ReturnType<typeof createFunction>;
  if (hasOnInitFunction(hook)) {
    resolver = createFunction(hook.onInit, hook.inject);
  } else {
    resolver = (_, [value]) => hook(value);
  }

  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    const hooks = session.annotations[initHooksMetaKey] || (session.annotations[initHooksMetaKey] = []);
    hooks.push(resolver);
    return next(session);
  }
}, { name: 'adi:hook:on-init-hook' });
