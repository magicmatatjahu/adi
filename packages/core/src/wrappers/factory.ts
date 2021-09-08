import { Injector, Session } from "../injector";
import { NextWrapper } from "../interfaces";
import { createWrapper } from "../utils";
import { DELEGATION } from "../constants";

function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  const oldSession = session.copy();
  return (...args: any[]) => {
    const newSession = oldSession.copy();
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
