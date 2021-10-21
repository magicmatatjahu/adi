import { Injector } from "../injector";
import { WrapperDef } from "../interfaces";
import { createNewWrapper, createWrapper } from "../utils";

function wrapper(injector: Injector): WrapperDef {
  return (_, session, next) => {
    return next(injector, session);
  }
}

export const WithInjector = createWrapper<Injector, true>(wrapper);

export const NewWithInjector = createNewWrapper((injector: Injector) => {
  return (session, next) => {
    session.injector = injector;
    return next(session);
  }
});
