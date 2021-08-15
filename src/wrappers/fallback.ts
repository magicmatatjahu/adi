import { NilInjectorError } from "../errors";
import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils";

function wrapper(token: Token): WrapperDef {
  return (injector, session, next) => {
    const newSession = session.copy();
    try {
      return next(injector, session);
    } catch(err) {
      if ((err as NilInjectorError).isNilInjectorError) {
        newSession.setToken(token);
        return injector.get(token, newSession.options, newSession.meta, newSession.parent);
        // return next(injector, newSession);
      }
      throw err;
    }
  }
}

export const Fallback = createWrapper<Token, true>(wrapper);
// export const Fallback = createWrapper(wrapper);

