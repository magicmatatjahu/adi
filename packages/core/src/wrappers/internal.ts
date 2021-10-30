import { SessionStatus } from "../enums";
import { Injector, Session } from "../injector";
import { Token } from "../types";
import { thenable } from "../utils";
import { createWrapper } from "../utils/wrappers";
import { OnDestroyHook } from "./on-destroy";

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

export const Internal = createWrapper((inject: 'session' | 'record' | 'definition' | 'instance', skipResolution: boolean = false) => {
  switch (inject) {
    case 'session': {
      return (session, next) => {
        if (skipResolution) return session;
        return thenable(
          () => next(session),
          value => [value, session],
        );
      }
    };
    case 'instance': {
      return (session, next) => {
        if (session.instance) return session.instance;
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

export const DestroyInjector = OnDestroyHook({
  onDestroy(session: Session) {
    const instance = session.parent && session.parent.instance;
    if (!instance) return;
    const injector = (instance as any).injector as Injector;
    if (!injector) return;
    delete (instance as any).injector;
    return injector.destroy();
  },
  inject: [Internal('session', true)],
});
