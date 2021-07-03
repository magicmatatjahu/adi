import { Injector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(_: never): WrapperDef {
  // console.log('side effects');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside side effects');
    const value = next(injector, session);
    session['$$sideEffects'] = true;
    return value;
  }
}

export const SideEffects = createWrapper(wrapper);