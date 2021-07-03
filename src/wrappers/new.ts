import { Injector, Context } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { Scope } from "../scope";
import { createWrapper } from "../utils";

function wrapper(ctxData: any): WrapperDef {
  // console.log('new');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside new');
    if (ctxData !== undefined) {
      session.options.ctx = new Context(ctxData);
    }
    session.options.scope = Scope.TRANSIENT;
    return next(injector, session);
  }
}

export const New = createWrapper(wrapper);
