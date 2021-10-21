import { WrapperDef } from "../interfaces";
import { Token as ProviderToken } from "../types";
import { createNewWrapper, createWrapper } from "../utils";

function wrapper(token: ProviderToken): WrapperDef {
  return (injector, session, next) => {
    session.setToken(token || session.getToken());
    return next(injector, session);
  }
}

export const Token = createWrapper<ProviderToken, true>(wrapper);

export const NewToken = createNewWrapper((token: ProviderToken) => {
  return (session, next) => {
    session.setToken(token || session.getToken());
    return next(session);
  }
});
