import { Injector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils";

function wrapper(token: Token): WrapperDef {
  // console.log('fallback');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside fallback');
    try {
      return next(injector, session);
    } catch(err) {
      if ((err as any).NilInjectorError === true) {
        session.options.token = token;
        return next(injector, session);
      }
      throw err;
    }
  }
}

export const Fallback = createWrapper(wrapper);

