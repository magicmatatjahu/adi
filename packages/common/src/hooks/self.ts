import { createHook, wait } from '@adi/core';
import { NoProviderError } from '@adi/core/lib/problem';

import type { Session, NextInjectionHook } from '@adi/core';

function hook(session: Session, next: NextInjectionHook) {  
  const currentInjector = session.context.injector;
  return wait(
    next(session),
    () => {
      if (currentInjector !== session.context.injector) {
        throw new NoProviderError(session);
      }
      return next(session);
    }
  );
}

export const Self = createHook(() => hook, { name: 'adi:hook:self' });
