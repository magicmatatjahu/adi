import { Hook, wait } from '@adi/core';
import { NoProviderError } from '@adi/core/lib/problem';

import type { Session, InjectionHookResult, NextInjectionHook } from '@adi/core';

export function Self<NextValue>() {
  return Hook(
    function selfHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
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
    },
    { name: 'adi:self' }
  )
}
