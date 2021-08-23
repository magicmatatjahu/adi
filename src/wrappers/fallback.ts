import { Session } from "../injector";
import { NilInjectorError } from "../errors";
import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper, thenable } from "../utils";

function wrapper(token: Token): WrapperDef {
  return (injector, session, next) => {
    const copiedSession = session.copy();
    return thenable(next, injector, session).then(
      val => val,
      err => {
        if ((err as NilInjectorError).isNilInjectorError) {
          const newSession = new Session(undefined, undefined, undefined, { ...copiedSession.options, token }, copiedSession.meta, copiedSession.parent);
          return injector.get(token, undefined, newSession);
          // return next(injector, newSession);
        }
        throw err;
      }
    );
  }
}

export const Fallback = createWrapper<Token, true>(wrapper);
