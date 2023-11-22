import { Hook, wait } from '@adi/core';

import type { Session, InjectionHookResult, NextInjectionHook } from '@adi/core';

export const PORTAL_KEY = 'adi:key:portal';

export interface PortalHookOptions {
  deep?: boolean;
}

export function Portal<NextValue>(options?: PortalHookOptions) {
  return Hook(
    function portalHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      const deep = options?.deep || false;
      if (session.hasFlag('dry-run')) {
        return next(session);
      }
  
      // set portal injector and options
      session.data[PORTAL_KEY] = {
        injector: session.injector,
        deep,
      }
  
      return wait(
        next(session),
        () => {
          return next(session);
        }
      )
    },
    { name: 'adi:portal' }
  )
}
