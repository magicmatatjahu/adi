import { createHook, SessionFlag, wait } from '@adi/core';

export const Lazy = createHook(() => {
  return (session, next) => {
    if (session.hasFlag(SessionFlag.DRY_RUN)) {
      return next(session);
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
  }
}, { name: 'adi:hook:lazy' });