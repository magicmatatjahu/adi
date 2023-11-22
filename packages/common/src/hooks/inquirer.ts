import { Hook } from '@adi/core';
import { resolveInstance } from "@adi/core/lib/injector/resolver";

import type { Session, InjectionHookResult, NextInjectionHook } from '@adi/core';

export function Inquirer<T = any>() {  
  return Hook(
    function inquirerHook(session: Session, next: NextInjectionHook): InjectionHookResult<T> {
      if (session.hasFlag('dry-run')) {
        return next(session);
      }
  
      const inquirerSession = session.parent?.parent;
      if (inquirerSession === undefined) {
        return undefined as T;
      }

      const { injector, provider, definition, instance, token, ctx, scope, annotations } = inquirerSession;
      Object.assign(session, {
        injector, 
        provider,
        definition,
        instance,
        token,
        ctx,
        scope,
        annotations,
      });
      return resolveInstance(session) as T;
    },
    { name: 'adi:inquirer' }
  )
}
