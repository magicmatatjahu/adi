import { SessionStatus } from "../enums";
import { Token } from "../types";
import { thenable } from "../utils";
import { createWrapper } from "../utils/wrappers";

export const AsyncDone = createWrapper(() => {
  return (session, next) => {
    return thenable(
      () => next(session),
      value => {
        const instance = session.instance;
        if (instance) {
          instance.doneResolve && instance.doneResolve(value);
        }
        return value;
      },
    );
  }
});

export const UseExisting = createWrapper((token: Token) => {
  return (session) => {
    session.record = undefined;
    session.definition = undefined;
    session.setToken(token);
    return session.injector.get(token, undefined, session);
  }
});

export const Internal = createWrapper((inject: 'session' | 'record' | 'definition' | 'instance') => {
  switch (inject) {
    case 'session': {
      return (session, next) => {
        return thenable(
          () => next(session),
          value => [value, session],
        );
      }
    };
    case 'instance': {
      return (session, next) => {
        return thenable(
          () => next(session),
          value => [value, session.instance],
        );
      }
    };
    case 'definition': {
      return (session, next) => {
        if (session.definition) return session.definition;
        // annotate session as dry run
        session.status |= SessionStatus.DRY_RUN;
        return thenable(
          () => next(session),
          value => [value, session.definition],
        );
      }
    };
    case 'record': {
      return (session, next) => {
        if (session.record) return session.record;
        // annotate session as dry run
        session.status |= SessionStatus.DRY_RUN;
        return thenable(
          () => next(session),
          value => [value, session.record],
        );
      }
    };
  }
});
