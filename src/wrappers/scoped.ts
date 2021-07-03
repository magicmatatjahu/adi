import { Injector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { Scope } from "../scope";
import { createWrapper } from "../utils";

function wrapper(scope: Scope): WrapperDef {
  // console.log('scoped');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside scope');
    session.options.scope = scope;
    return next(injector, session);
  }
}

export const Scoped = createWrapper(wrapper);
