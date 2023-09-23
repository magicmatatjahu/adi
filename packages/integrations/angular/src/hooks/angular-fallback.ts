import { Hook, waitCallback } from "@adi/core";
import { noopThen } from "@adi/core/lib/utils";
import { NotFoundProviderError } from "@adi/core/lib/errors/not-found-provider.error";

import { ANGULAR_INJECTOR } from '../tokens';

import type { Session, NextInjectionHook, InjectionHookResult } from '@adi/core';
import type { ProviderToken, InjectOptions } from '@angular/core';

export function AngularFallback<NextValue, T>(token: ProviderToken<T>, flags: InjectOptions = {}) {
  return Hook(
    function angularFallbackHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<T | null> {
      const angularInjector = session.context.injector.getSync(ANGULAR_INJECTOR);

      return waitCallback(
        () => next(session),
        noopThen,
        err => {
          if (err instanceof NotFoundProviderError) {
            return angularInjector.get(token, undefined, flags);
          }
          throw err;
        }
      );
    },
    { name: 'adi:angular-fallback' }
  )
}
