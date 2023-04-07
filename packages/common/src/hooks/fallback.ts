import { InjectionHookKind } from "@adi/core/lib/enums";
import { createHook, wait, waitCallback } from "@adi/core";
import { resolve } from "@adi/core/lib/injector/resolver";
import { NoProviderError } from "@adi/core/lib/problem";
import { createArray } from "@adi/core/lib/utils";

import type { ProviderToken, InjectionHook } from "@adi/core";

export type FallbackType<P> = P; 

export interface FallbackHookOptions {
  token: ProviderToken;
  hooks: InjectionHook | Array<InjectionHook>;
}

export const Fallback = createHook((options: ProviderToken | FallbackHookOptions) => {
  let token: ProviderToken = options as ProviderToken;
  let hooks: Array<InjectionHook> = [];
  if ((options as FallbackHookOptions).token) {
    token = (options as FallbackHookOptions).token;
    hooks = createArray((options as FallbackHookOptions).hooks);
  }

  return (session, next) => {
    const forked = session.fork();

    return waitCallback(
      () => next(session),
      undefined,
      err => {
        if (err instanceof NoProviderError) {
          // preserve all information about session
          ((session as any).injection = forked.injection).options.token = token;
          const context = (session as any).context = forked.context;
          context.provider = context.definition = context.instance = undefined;
          return resolve(context.injector, session, hooks);
        }
        throw err;
      }
    );
  }
}, { name: 'adi:hook:fallback' });