import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(labels: Record<string | symbol, any>): WrapperDef {
  return (injector, session, next) => {
    session.addLabels(labels);
    return next(injector, session);
  }
}

export const Labelled = createWrapper(wrapper);