import { Injector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(labels: Record<string | symbol, any>): WrapperDef {
  // console.log('labelled');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside labelled');
    session.options.labels = Object.assign(session.options.labels, labels);
    return next(injector, session);
  }
}

export const Labelled = createWrapper(wrapper);