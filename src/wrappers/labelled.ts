import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";
import { createWrapper as cr } from "../utils/wrappers.new";

function wrapper(labels: Record<string | symbol, any>): WrapperDef {
  return (injector, session, next) => {
    session.addLabels(labels);
    return next(injector, session);
  }
}

export const NewLabelled = cr<Record<string | symbol, any>, true>(wrapper);
export const Labelled = createWrapper(wrapper);