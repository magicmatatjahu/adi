import { InjectionItem, PlainInjections, WrapperDef } from "../interfaces";
import { createWrapper } from "../utils/wrappers";

function wrapper(injections: Array<InjectionItem> | PlainInjections): WrapperDef {
  return (injector, session, next) => {
    session.options.injections = injections;
    return next(injector, session);
  }
}

export const WithDependencies = createWrapper<Array<InjectionItem> | PlainInjections, true>(wrapper);
