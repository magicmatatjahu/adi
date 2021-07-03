import { Injector, Context } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(ctxOrData: Context | any): WrapperDef {
  // console.log('ctx');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside ctx');
    if (ctxOrData instanceof Context) {
      session.options.ctx = ctxOrData;
    } else {
      session.options.ctx = new Context(ctxOrData);
    }
    return next(injector, session);
  }
}

export const Ctx = createWrapper(wrapper);