import { Injector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { Token as ProviderToken } from "../types";
import { createWrapper } from "../utils";

function wrapper(token: ProviderToken): WrapperDef {
  // console.log('token');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside token');
    session.options.token = token || session.options.token;
    return next(injector, session);
  }
}

export const Token = createWrapper(wrapper);
