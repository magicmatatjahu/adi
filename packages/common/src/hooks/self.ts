import { createHook, wait } from '@adi/core';
import { NoProviderError } from '@adi/core/lib/problem';

export const Self = createHook(() => {
  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }
  
    const forked = session.fork();
    forked.setFlag('dry-run');
    const currentInjector = session.context.injector;

    return wait(
      next(forked),
      () => {
        if (currentInjector !== forked.context.injector) {
          throw new NoProviderError(session);
        }
        return next(session);
      }
    );
  }
}, { name: 'adi:hook:self' });
