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

function internalWrapper(inject: 'record' | 'definition' | 'instance'): WrapperDef {
  return (injector, session, next) => {
    if (inject === 'instance') {
      return thenable(
        () => next(injector, session),
        _ => session.instance,
      );
    }

    // annotate session as dry run
    session.status |= SessionStatus.DRY_RUN;

    return thenable(
      () => next(injector, session),
      _ => inject === 'definition' ? session.definition : session.record,
    );
  }
}

export const Internal = createWrapper<'record' | 'definition' | 'instance', true>(internalWrapper);