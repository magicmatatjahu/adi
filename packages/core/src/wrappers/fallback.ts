import { Session } from "../injector";
import { NilInjectorError } from "../errors";
import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper, thenable } from "../utils";

interface FallbackProvider {
  
}

function wrapper(token: Token): WrapperDef {
  return (injector, session, next) => {
    const copiedSession = session.copy();
    return thenable(
      () => next(injector, session),
      val => val,
      err => {
        if ((err as NilInjectorError).isNilInjectorError) {
          // TODO: Change to `session.fork()` and set undefined to the record, definition and instance
          const newSession = new Session(undefined, undefined, undefined, { ...copiedSession.options, token }, copiedSession.meta, copiedSession.parent);
          // TODO: use the return next(injector, newSession); case - fix the bugs in two tests - in Decorate wrapper and Fallback wrapper
          return injector.get(token, undefined, newSession);
          // return next(injector, newSession);
        }
        throw err;
      }
    );
  }
}

export const Fallback = createWrapper<Token, true>(wrapper);
