import { createWrapper, SessionStatus, FunctionInjections } from '@adi/core';
import { createFunction } from '@adi/core/lib/injector';
import { thenable } from '@adi/core/lib/utils';

export interface TransformOptions<T = any> extends FunctionInjections {
  transform: (toTransform: T, ...args: any[]) => any | Promise<any>;
}

export const Transform = createWrapper((options: TransformOptions) => {
  const transform = createFunction(options.transform, options);

  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }

    // copy session
    const forkedSession = session.fork();

    return thenable(
      () => next(session),
      value => {
        session.setSideEffect(false);
        return thenable(
          () => transform(forkedSession.injector, forkedSession, value),
          transformedValue => transformedValue,
        );
      }
    );
  }
}, { name: 'Transform' });
