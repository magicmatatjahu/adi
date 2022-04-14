import { createHook, SessionFlag } from '@adi/core';

import type { NextHook, Session } from '@adi/core';

function factoryHook(session: Session, next: NextHook) {
  if (session.hasFlag(SessionFlag.DRY_RUN)) {
    return next(session);
  }

  const oldSession = session.fork();
  return (...args: any[]) => {
    const newSession = oldSession.fork();
    if (Array.isArray(args) && args.length > 0) {
      // add delegation
      // newSession.meta[DELEGATION.KEY] = args;
      return next(newSession);
    }
    return next(newSession);
  }
}

export const Factory = createHook(() => factoryHook, { name: 'adi:hook:factory' });