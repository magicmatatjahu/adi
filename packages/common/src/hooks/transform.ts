import { createHook, SessionFlag, wait, InjectionItem, InjectionKind } from '@adi/core';;
import { convertDependencies, resolverFunction } from '@adi/core/lib/injector';

import type { Injector, Session } from '@adi/core';

export interface TransformHookOptions<T = any> {
  transform: (toTransform: T, ...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

function isTransformFunction(transform: unknown): transform is TransformHookOptions {
  return typeof (transform as TransformHookOptions).transform === 'function';
}

export const Transform = createHook((options: ((toTransform: any) => any) | TransformHookOptions) => {
  let resolver: (injector: Injector, session: Session, value?: any) => any;
  if (isTransformFunction(options)) {
    const data = { useFunction: options.transform, inject: convertDependencies(options.inject || [], { kind: InjectionKind.FUNCTION, handler: options.transform }) };
    resolver = (injector: Injector, session: Session, value?: any) => resolverFunction(injector, session, data, value);
  } else {
    resolver = (_: Injector, __: Session, value?: any) => value;
  }

  return (session, next) => {
    if (session.hasFlag(SessionFlag.DRY_RUN)) {
      return next(session);
    }

    // fork session
    const forkedSession = session.fork();
    return wait(
      next(session),
      value => {
        return resolver(forkedSession.ctx.injector, forkedSession, value);
      }
    );
  }
}, { name: 'adi:hook:transform' });
