import { Hook } from "@adi/core";
import { wait, isProviderToken } from '@adi/core/lib/utils';

import type { Session, InjectionHookResult, NextInjectionHook, ProviderToken } from '@adi/core';

export function Config<T = undefined, NextValue = unknown>(token?: ProviderToken) {
  const toSelf = isProviderToken(token) === false;

  return Hook(
    function configHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<T extends undefined ? NextValue : T> {
      if (toSelf) {
        const parent = session.parent;
        if (!parent) {
          return undefined as any;
        }
  
        const config = parent.definition?.annotations.config;
        if (isProviderToken(config)) {
          session.token = config;
          return next(session) as any
        }
        return config as  any
      }
  
      if (session.hasFlag('dry-run')) {
        return next(session) as any;
      }
  
      const forked = session.fork();
      forked.setFlag('dry-run');
      forked.token = token;
      return wait(
        next(forked),
        () => {
          const config = forked.definition?.annotations.config;
          if (isProviderToken(config)) {
            session.token = config;
            return next(session);
          }
          return config as T
        },
      ) as any;
    },
    { name: 'adi:config' }
  )
}
