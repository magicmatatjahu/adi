import { Session } from "../injector";
import { NextWrapper } from "../interfaces";
import { createWrapper } from "../utils";
import { DELEGATION } from "../constants";
import { SessionStatus } from "../enums";

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
