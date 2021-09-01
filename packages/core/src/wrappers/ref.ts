import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils";

function wrapper(ref: () => Token): WrapperDef {
  return (injector, session, next) => {
    session.setToken(ref());
    return next(injector, session);
  }
}

export const Ref = createWrapper<() => Token, true>(wrapper);
