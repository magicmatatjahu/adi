import { createHook, wait } from '@adi/core';

export const PORTAL_KEY = 'adi:key:portal';

export const Portal = createHook(() => {
  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    // set portal injector and options
    session.annotations[PORTAL_KEY] = {
      injector: session.context.injector,
    }

    return wait(
      next(session),
      () => {
        return next(session);
      }
    )
  }
}, { name: 'adi:hook:portal' });
