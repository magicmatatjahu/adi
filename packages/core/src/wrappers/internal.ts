import { SessionStatus } from "../enums";
import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { thenable } from "../utils";
import { createNewWrapper, createWrapper } from "../utils/wrappers";

// TODO: check if record and def in the session should be overrided 
function existingWrapper(token: Token): WrapperDef {
  return (injector, session) => {
    session.record = undefined;
    session.definition = undefined;
    session.setToken(token);
    return injector.get(token, undefined, session);
  }
}

export const UseExisting = createWrapper<Token, true>(existingWrapper);

export const NewUseExisting = createNewWrapper((token: Token) => {
  return (session) => {
    session.record = undefined;
    session.definition = undefined;
    session.setToken(token);
    return session.injector.newGet(token, undefined, session);
  }
});

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
