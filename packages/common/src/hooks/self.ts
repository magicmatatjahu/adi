import { Hook, wait } from '@adi/core';
import { NotFoundProviderError } from "@adi/core/lib/errors/not-found-provider.error";

import type { Session, InjectionHookResult, NextInjectionHook } from '@adi/core';

export function Self<NextValue>() {
  return Hook(
    function selfHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      const currentInjector = session.injector;
      return wait(
        next(session),
        () => {
          if (currentInjector !== session.injector) {
            throw new NotFoundProviderError({ session });
          }
          return next(session);
        }
      );
    },
    { name: 'adi:self' }
  )
}
