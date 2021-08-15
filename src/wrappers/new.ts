import { Context } from "../injector";
import { WrapperDef } from "../interfaces";
import { Scope } from "../scope";
import { createWrapper } from "../utils";
import { createWrapper as cr } from "../utils/wrappers.new";

function wrapper(ctxData?: any): WrapperDef {
  return (injector, session, next) => {
    if (ctxData !== undefined) {
      session.setContext(new Context(ctxData));
    }
    session.setScope(Scope.TRANSIENT);
    return next(injector, session);
  }
}

export const NewNew = cr<any, false>(wrapper);
export const New = createWrapper(wrapper);
