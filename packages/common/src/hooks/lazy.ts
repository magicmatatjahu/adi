import { Hook, wait } from '@adi/core';

import type { Session, InjectionHookResult, NextInjectionHook } from '@adi/core';

export function Lazy<NextValue>() {  
  return Hook(
    function lazyHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<() => NextValue> {
      if (session.hasFlag('dry-run')) {
        return next(session) as any;
      }
  
      let value: any, resolved = false;
      return () => {
        if (resolved === false) {
          resolved = true;
          return value = wait(
            next(session),
            v => value = v,
          );
        }
        return value;
      };
    },
    { name: 'adi:lazy' }
  )
}
