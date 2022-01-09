import { createWrapper, Session, NextWrapper, SessionStatus } from '@adi/core';

import { DELEGATION } from "../constants";

function wrapper(session: Session, next: NextWrapper) {
  if (session.status & SessionStatus.DRY_RUN) {
    return next(session);
  }

  const oldSession = session.fork();
  return (...args: any[]) => {
    const newSession = oldSession.fork();
    if (Array.isArray(args) && args.length > 0) {
      // add delegation
      newSession.meta[DELEGATION.KEY] = args;
      return next(newSession);
    }
    return next(newSession);
  }
}

export const Factory = createWrapper(() => wrapper, { name: 'Factory' });
