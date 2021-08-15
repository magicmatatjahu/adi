import { Session } from "../injector";
import { NilInjectorError } from "../errors";
import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils";

function wrapper(token: Token): WrapperDef {
  return (injector, session, next) => {
    const copiedSession = session.copy();
    try {
      return next(injector, session);
    } catch(err) {
      if ((err as NilInjectorError).isNilInjectorError) {
        const newSession = new Session(undefined, undefined, undefined, copiedSession.options, copiedSession.meta, copiedSession.parent);
        newSession.setToken(token);
        return injector.get(token, undefined, newSession);
        // return next(injector, newSession);
      }
      throw err;
    }
  }
}

export const Fallback = createWrapper<Token, true>(wrapper);
// export const Fallback = createWrapper(wrapper);

