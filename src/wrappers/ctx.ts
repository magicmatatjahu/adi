import { Context } from "../injector";
import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(ctxOrData: Context | any): WrapperDef {
  return (injector, session, next) => {
    if (ctxOrData instanceof Context) {
      session.setContext(ctxOrData);
    } else {
      session.setContext(new Context(ctxOrData));
    }
    return next(injector, session);
  }
}

export const Ctx = createWrapper(wrapper);