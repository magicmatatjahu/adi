import { createHook, SessionFlag, wait } from '@adi/core';
import { NilInjectorError } from '@adi/core/lib/problem';

import type { ClassType } from '@adi/core';

export interface SelfHookOptions {
  from: 'imports' | ClassType;
}

export const Self = createHook((options: SelfHookOptions) => {
  const from = options?.from || 'self';

  return (session, next) => {
    if (session.hasFlag(SessionFlag.DRY_RUN)) {
      return next(session);
    }
  
    const forkedSession = session.fork();
    // annotate forked session as dry run
    forkedSession.setFlag(SessionFlag.DRY_RUN);
    // run next to retrieve updated session
    return wait(
      next(forkedSession),
      () => {
        switch (from) {
          case 'self': {
            // calculated injector should be the same as injector from session
            if (session.ctx.injector !== forkedSession.ctx.injector) {
              throw new NilInjectorError(session.options.token);
            }
            return next(session);
          };
          case 'imports': {

          }
        }
      }
    );
  }
}, { name: 'adi:hook:self' });
