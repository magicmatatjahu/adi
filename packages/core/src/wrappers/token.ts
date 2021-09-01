import { WrapperDef } from "../interfaces";
import { Token as ProviderToken } from "../types";
import { createWrapper } from "../utils";

function wrapper(token: ProviderToken): WrapperDef {
  return (injector, session, next) => {
    session.setToken(token || session.getToken());
    return next(injector, session);
  }
}

export const Token = createWrapper<ProviderToken, true>(wrapper);
