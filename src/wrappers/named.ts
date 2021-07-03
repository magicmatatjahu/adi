import { Injector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { CONSTRAINTS } from "../constants"
import { createWrapper } from "../utils";

function wrapper(name: string): WrapperDef {
  // console.log('named');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside named');
    session.options.labels[CONSTRAINTS.NAMED] = name;
    return next(injector, session);
  }
}

export const Named = createWrapper(wrapper);
