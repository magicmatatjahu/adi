import { InjectionItem, PlainInjections, WrapperDef } from "../interfaces";
import { createNewWrapper, createWrapper } from "../utils/wrappers";

function wrapper(injections: Array<InjectionItem> | PlainInjections): WrapperDef {
  return (injector, session, next) => {
    session.options.injections = injections;
    return next(injector, session);
  }
}

export const WithDependencies = createWrapper<Array<InjectionItem> | PlainInjections, true>(wrapper);

export const NewWithDependencies = createNewWrapper((injections: Array<InjectionItem> | PlainInjections) => {
  return (session, next) => {
    session.options.injections = injections;
    return next(session);
  }
});
