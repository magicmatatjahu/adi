import { Hook, waitCallback } from "@adi/core";
import { resolve } from "@adi/core/lib/injector/resolver";
import { NotFoundProviderError } from "@adi/core/lib/errors/not-found-provider.error";
import { createArray, noopThen } from "@adi/core/lib/utils";

import type { Session, InjectionHookResult, NextInjectionHook, ProviderToken, InjectionHook } from '@adi/core';

export interface FallbackHookOptions<T = any> {
  token: ProviderToken<T>;
  hooks: InjectionHook | Array<InjectionHook>;
}

export function Fallback<NextValue, T>(options: ProviderToken<T> | FallbackHookOptions<T>) {
  let token: ProviderToken = options as ProviderToken;
  let hooks: Array<InjectionHook> = [];
  if ((options as FallbackHookOptions<T>).token) {
    token = (options as FallbackHookOptions).token;
    hooks = createArray((options as FallbackHookOptions).hooks);
  }

  return Hook(
    function fallbackHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue | T> {
      const forked = session.fork();
      return waitCallback(
        () => next(session),
        noopThen,
        err => {
          if (err instanceof NotFoundProviderError) {
            // preserve all information about session
            session.apply(forked);
            session.token = token;
            session.provider = session.definition = session.instance = undefined;
            return resolve(session.injector, session, hooks);
          }
          throw err;
        }
      );
    },
    { name: 'adi:fallback' }
  )
}
