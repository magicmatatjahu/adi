import { Hook, wait, createCustomResolver } from '@adi/core';

import type { Session, InjectionHookResult, NextInjectionHook, InjectionItem, CustomResolver } from '@adi/core';

export interface TransformHookOptions<T = any> {
  transform: (toTransform: T, ...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

function hasTransformFunction(transform: unknown): transform is TransformHookOptions {
  return typeof (transform as TransformHookOptions).transform === 'function';
}

export function Transform<NextValue, T = NextValue>(transformOrOptions: ((toTransform: NextValue) => T) | TransformHookOptions) {
  let resolver: CustomResolver
  if (hasTransformFunction(transformOrOptions)) {
    resolver = createCustomResolver({ kind: 'function', handler: transformOrOptions.transform, inject: transformOrOptions.inject });
  } else {
    resolver = createCustomResolver({ kind: 'function', handler: transformOrOptions })
  }
  
  return Hook(
    function transformHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<T> {
      if (session.hasFlag('dry-run')) {
        return next(session) as T;
      }
  
      return wait(
        next(session),
        value => resolver(session, value)
      ) as T;
    },
    { name: 'adi:transform' }
  )
}
