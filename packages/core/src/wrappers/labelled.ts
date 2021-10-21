import { WrapperDef } from "../interfaces";
import { createNewWrapper, createWrapper } from "../utils";

function wrapper(labels: Record<string | symbol, any>): WrapperDef {
  return (injector, session, next) => {
    session.addLabels(labels);
    return next(injector, session);
  }
}

export const Labelled = createWrapper<Record<string | symbol, any>, true>(wrapper);

export const NewLabelled = createNewWrapper((labels: Record<string | symbol, any>) => {
  return (session, next) => {
    session.addLabels(labels);
    return next(session);
  }
});
