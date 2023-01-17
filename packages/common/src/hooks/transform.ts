import { createHook, wait, InjectionItem, createFunctionResolver } from '@adi/core';;

import type { Injector, Session } from '@adi/core';

export interface TransformHookOptions<T = any> {
  transform: (toTransform: T, ...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

function isTransformFunction(transform: unknown): transform is TransformHookOptions {
  return typeof (transform as TransformHookOptions).transform === 'function';
}

export const Transform = createHook((options: ((toTransform: any) => any) | TransformHookOptions) => {
  let resolver: ReturnType<typeof createFunctionResolver>;
  if (isTransformFunction(options)) {
    resolver = createFunctionResolver(options.transform, options.inject || []);
  } else {
    resolver = (_: Session, args: any[]) => options(args[0]);
  }

  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    // fork session
    const forked = session.fork();
    return wait(
      next(session),
      value => {
        // TODO: forked session is not connected to the `session` so there is a problem to destroy created instances (we don't have any links) 
        return resolver(forked, [value]);
      }
    );
  }
}, { name: 'adi:hook:transform' });
