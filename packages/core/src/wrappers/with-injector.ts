import { Injector } from "../injector";
import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(injector: Injector): WrapperDef {
  return (_, session, next) => {
    return next(injector, session);
  }
}

export const WithInjector = createWrapper<Injector, true>(wrapper);