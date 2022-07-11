import { createHook, waitCallback } from "@adi/core";
import { resolve } from "@adi/core/lib/injector";
import { NilInjectorError } from "@adi/core/lib/problem";

import type { ProviderToken, InjectionHook } from "@adi/core";

export interface FallbackHookOptions {
  token: ProviderToken;
  hooks: Array<InjectionHook>;
}

export const Fallback = createHook((options: ProviderToken | FallbackHookOptions) => {
  let token: ProviderToken = options as ProviderToken;
  let hooks: Array<InjectionHook> = [];
  if ((options as FallbackHookOptions).token) {
    token = (options as FallbackHookOptions).token;
    hooks = (options as FallbackHookOptions).hooks || [];
  }

  return (session, next) => {
    const forkedSession = session.fork();
    return waitCallback(
      () => next(session),
      val => val,
      err => {
        if (err instanceof NilInjectorError) {
          forkedSession.options.token = token;
          const ctx = forkedSession.ctx;
          ctx.record = ctx.def = ctx.instance = undefined;
          return resolve(ctx.injector, forkedSession, hooks);
        }
        throw err;
      }
    );
  }
}, { name: 'adi:hook:fallback' });
