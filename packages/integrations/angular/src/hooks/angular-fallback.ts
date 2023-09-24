import { Hook, waitCallback } from "@adi/core";
import { noopThen } from "@adi/core/lib/utils";
import { NotFoundProviderError } from "@adi/core/lib/errors/not-found-provider.error";

import { NG_INJECTOR } from '../tokens';

import type { Session, NextInjectionHook, InjectionHookResult } from '@adi/core';
import type { ProviderToken, InjectOptions } from '@angular/core';

export function AngularFallback<NextValue, T>(token: ProviderToken<T>, flags: InjectOptions = {}) {
  return Hook(
    function angularFallbackHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<T | null> {
      const ngInjector = session.context.injector.getSync(NG_INJECTOR);

      return waitCallback(
        () => next(session),
        noopThen,
        err => {
          if (err instanceof NotFoundProviderError) {
            return ngInjector.get(token, undefined, flags);
          }
          throw err;
        }
      );
    },
    { name: 'adi:angular-fallback' }
  )
}
