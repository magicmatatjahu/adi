import { Hook, waitCallback } from "@adi/core";
import { runInjectioHooks, useHooks } from "@adi/core/lib/hooks/private";
import { resolve } from "@adi/core/lib/injector/resolver";
import { NotFoundProviderError } from "@adi/core/lib/errors/not-found-provider.error";
import { noopThen } from "@adi/core/lib/utils";

import type { Session, InjectionHookResult, NextInjectionHook, ProviderToken, InjectionHook, InjectionHookContext, UseHooks } from '@adi/core';

export interface FallbackHookOptions<T, NextValue, Then> {
  token: ProviderToken<T>;
  hooks: (use: UseHooks<NextValue>) => Then,
}

function hasHooksFunction(fallback: unknown): fallback is FallbackHookOptions<any, any, any> {
  return typeof (fallback as FallbackHookOptions<any, any, any>).hooks === 'function';
}

export function Fallback<NextValue, T, Then>(options: ProviderToken<T> | FallbackHookOptions<T, NextValue, Then>) {
  let token: ProviderToken = options as ProviderToken;
  let hooks: Array<InjectionHook> = [];
  if (hasHooksFunction(options)) {
    token = options.token;
    hooks = options.hooks(useHooks) as Array<InjectionHook>
  }

  return Hook(
    function fallbackHook(session: Session, next: NextInjectionHook<NextValue>, ctx: InjectionHookContext): InjectionHookResult<NextValue | T> {
      const forked = session.fork();
      return waitCallback(
        () => next(session),
        noopThen,
        err => {
          if (err instanceof NotFoundProviderError) {
            // preserve all information about session
            session.apply(forked);
            session.token = token;

            if (ctx.kind === 'provider' || ctx.kind === 'definition') {
              // clear session's context information
              session.provider = session.definition = session.instance = undefined;
              return resolve(session.injector, session, hooks);
            }

            const newCtx: Partial<InjectionHookContext> = { kind: ctx.kind, hooks, current: undefined }
            return runInjectioHooks(hooks, session, newCtx, next);
          }

          throw err;
        }
      );
    },
    { name: 'adi:fallback' }
  )
}
