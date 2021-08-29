import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils/wrappers";

function wrapper(token: Token): WrapperDef {
  return (injector, session) => {
    const newSession = session.fork();
    newSession.setToken(token);
    if (newSession.isAsync() === true) {
      return injector.getAsync(token, undefined, newSession);
    }
    return injector.get(token, undefined, newSession);
  }
}

export const UseExisting = createWrapper<Token, true>(wrapper);
