import { createHook, wait, createFunctionResolver } from '@adi/core';;

import type { InjectionItem } from '@adi/core';

export interface TransformHookOptions<T = any> {
  transform: (toTransform: T, ...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

function hasTransformFunction(transform: unknown): transform is TransformHookOptions {
  return typeof (transform as TransformHookOptions).transform === 'function';
}

export const Transform = createHook((transformOrOptions: ((toTransform: any) => any) | TransformHookOptions) => {
  let resolver: ReturnType<typeof createFunctionResolver>;
  if (hasTransformFunction(transformOrOptions)) {
    resolver = createFunctionResolver(transformOrOptions.transform, transformOrOptions.inject || []);
  } else {
    resolver = (_, [value]) => transformOrOptions(value);
  }

  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    return wait(
      next(session),
      value => {
        return resolver(session, [value]);
      }
    );
  }
}, { name: 'adi:hook:transform' });
