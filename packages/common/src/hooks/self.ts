import { createHook, wait } from '@adi/core';
import { NoProviderError } from '@adi/core/lib/problem';

import type { Session, NextInjectionHook } from '@adi/core';

function hook(session: Session, next: NextInjectionHook) {
  let forked = session;
  if (!session.hasFlag('dry-run')) {
    forked = session.fork();
    forked.setFlag('dry-run');
  }
  
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

export const Self = createHook(() => hook, { name: 'adi:hook:self' });
