import { Context } from "../injector";
import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils/wrappers";

function wrapper(token: Token): WrapperDef {
  return (injector, session) => {
    const newSession = session.copy();
    newSession.setToken(token);
    return injector.get(token, undefined, newSession);
  }
}

export const UseExisting = createWrapper<Token, true>(wrapper);
