import { Injector, Session } from "../injector";
import { NewNextWrapper, NextWrapper } from "../interfaces";
import { createNewWrapper, createWrapper } from "../utils";
import { DELEGATION } from "../constants";
import { SessionStatus } from "../enums";

function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  if (session.status & SessionStatus.DRY_RUN) {
    return next(injector, session);
  }

  const oldSession = session.fork();
  return (...args: any[]) => {
    const newSession = oldSession.fork();
    if (Array.isArray(args) && args.length > 0) {
      // add delegation
      newSession[DELEGATION.KEY] = {
        type: 'multiple',
        values: args,
      };
      return next(injector, newSession);
    }
    return next(injector, newSession);
  }
}

export const Factory = createWrapper<undefined, false>(() => wrapper);

function newWrapper(session: Session, next: NewNextWrapper) {
  if (session.status & SessionStatus.DRY_RUN) {
    return next(session);
  }

  const oldSession = session.fork();
  return (...args: any[]) => {
    const newSession = oldSession.fork();
    if (Array.isArray(args) && args.length > 0) {
      // add delegation
      newSession[DELEGATION.KEY] = {
        type: 'multiple',
        values: args,
      };
      return next(newSession);
    }
    return next(newSession);
  }
}

export const NewFactory = createNewWrapper(() => newWrapper);
