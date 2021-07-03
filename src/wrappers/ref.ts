import { Injector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils";

function wrapper(ref: () => Token): WrapperDef {
  // console.log('ref');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside ref');
    session.options.token = ref();
    return next(injector, session);
  }
}

export const Ref = createWrapper(wrapper);
