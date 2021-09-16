import { SessionStatus } from "../enums";
import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { thenable } from "../utils";
import { createWrapper } from "../utils/wrappers";

// TODO: check if record and def in the session should be overrided 
function useExistingWrapper(token: Token): WrapperDef {
  return (injector, session) => {
    // const newSession = session.fork();
    // newSession.setToken(token);
    // if (newSession.isAsync() === true) {
    //   return injector.getAsync(token, undefined, newSession);
    // }
    // return injector.get(token, undefined, newSession);
    session.setToken(token);
    return injector.get(token, undefined, session);
  }
}

export const UseExisting = createWrapper<Token, true>(useExistingWrapper);

function internalWrapper(inject: 'session' | 'record' | 'definition' | 'instance'): WrapperDef {
  switch (inject) {
    case 'session': {
      return (injector, session, next) => {
        return thenable(
          () => next(injector, session),
          value => [value, session],
        );
      }
    };
    case 'instance': {
      return (injector, session, next) => {
        return thenable(
          () => next(injector, session),
          value => [value, session.instance],
        );
      }
    };
    case 'definition': {
      return (injector, session, next) => {
        if (session.definition) return session.definition;
        // annotate session as dry run
        session.status |= SessionStatus.DRY_RUN;
        return thenable(
          () => next(injector, session),
          value => [value, session.definition],
        );
      }
    };
    case 'record': {
      return (injector, session, next) => {
        if (session.record) return session.record;
        // annotate session as dry run
        session.status |= SessionStatus.DRY_RUN;
        return thenable(
          () => next(injector, session),
          value => [value, session.record],
        );
      }
    };
  }
}

export const Internal = createWrapper<'session' | 'record' | 'definition' | 'instance', true>(internalWrapper);
