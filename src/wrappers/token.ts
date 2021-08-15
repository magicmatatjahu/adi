import { WrapperDef } from "../interfaces";
import { Token as ProviderToken } from "../types";
import { createWrapper } from "../utils";
import { createWrapper as cr } from "../utils/wrappers.new";

function wrapper(token: ProviderToken): WrapperDef {
  return (injector, session, next) => {
    session.setToken(token || session.getToken());
    return next(injector, session);
  }
}

export const NewToken = cr<ProviderToken, true>(wrapper);
export const Token = createWrapper(wrapper);
