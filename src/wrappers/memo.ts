import { Injector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(_: never): WrapperDef {
  // console.log('memo');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside memo');
    const value = next(injector, session);
    session['$$sideEffects'] = false;
    return value;
  }
}

export const Memo = createWrapper(wrapper);