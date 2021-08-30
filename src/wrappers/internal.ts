import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils/wrappers";

function wrapper(token: Token): WrapperDef {
  return (injector, session) => {
    // const newSession = session.fork();
    // newSession.setToken(token);
    // if (newSession.isAsync() === true) {
    //   return injector.getAsync(token, undefined, newSession);
    // }
    // return injector.get(token, undefined, newSession);
    session.setToken(token);
    if (session.isAsync() === true) {
      return injector.getAsync(token, undefined, session);
    }
    return injector.get(token, undefined, session);
  }
}

export const UseExisting = createWrapper<Token, true>(wrapper);
