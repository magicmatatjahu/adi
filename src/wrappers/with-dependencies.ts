import { PlainInjections, WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper, Wrapper } from "../utils/wrappers";


function wrapper(injections: Array<Token | Wrapper> | PlainInjections): WrapperDef {
  return (injector, session, next) => {
    session.options.injections = injections;
    return next(injector, session);
  }
}

export const WithDependencies = createWrapper<Array<Token | Wrapper> | PlainInjections, true>(wrapper);
