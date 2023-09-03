import { Hook, wait } from '@adi/core';

import type { Injector, Session, InjectionHookResult, NextInjectionHook } from '@adi/core';

// TODO: what about metadatas/annotations applied by another hooks?
// It should apply metadatas and go to the parent injector when definition is not found - preserve session options/metadata across all injector checks 
function findInjector(session: Session, next: NextInjectionHook, hostInjector: Injector): Injector | Promise<Injector> {
  const forked = session.fork();
  forked.setFlag('dry-run');

  return wait(
    next(forked),
    () => {
      const injector = forked.context.injector;
      if (injector === hostInjector) {
        // accept null or undefined injector in tree
        session.context.injector = injector.parent!;
        return findInjector(session, next, hostInjector);
      }
      return injector;
    }
  );
}

export function SkipSelf<NextValue>() {
  return Hook(
    function skipSelfHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      return wait(
        findInjector(session, next, session.context.injector),
        injector => {
          session.context.injector = injector;
          return next(session);
        },
      );
    },
    { name: 'adi:skip-self' }
  )
}
