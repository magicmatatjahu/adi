import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils";

function wrapper(token: Token): WrapperDef {
  return (injector, session, next) => {
    try {
      return next(injector, session);
    } catch(err) {
      if ((err as any).NilInjectorError === true) {
        session.setToken(token);
        return next(injector, session);
      }
      throw err;
    }
  }
}

export const Fallback = createWrapper(wrapper);

