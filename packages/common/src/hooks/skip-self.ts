import { createHook, wait } from '@adi/core';

import type { Injector, Session, NextInjectionHook } from '@adi/core';

function findInjector(session: Session, next: NextInjectionHook, hostInjector: Injector): Injector | Promise<Injector> {
  const forked = session.fork();
  forked.setFlag('dry-run');

  return wait(
    next(forked),
    () => {
      const injector = forked.context.injector;
      if (injector === hostInjector) {
        forked.context.injector = injector.parent;
        return findInjector(session, next, hostInjector);
      }
      return injector;
    }
  );
}

function hook(session: Session, next: NextInjectionHook) {
  return wait(
    findInjector(session, next, session.context.injector),
    injector => {
      session.context.injector = injector;
      return next(session);
    },
  );
}

export const SkipSelf = createHook(() => hook, { name: 'adi:hook:skip-self' });
