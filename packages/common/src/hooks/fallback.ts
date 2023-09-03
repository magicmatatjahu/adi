import { Hook, waitCallback } from "@adi/core";
import { resolve } from "@adi/core/lib/injector/resolver";
import { NoProviderError } from "@adi/core/lib/problem";
import { createArray, noopCatch, noopThen } from "@adi/core/lib/utils";

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
          if (err instanceof NoProviderError) {
            // preserve all information about session
            session.apply(forked);
            session.inject.token = token;
            const context = session.context;
            context.provider = context.definition = context.instance = undefined;
            return resolve(session.context.injector, session, hooks);
          }
          throw err;
        }
      );
    },
    { name: 'adi:fallback' }
  )
}
