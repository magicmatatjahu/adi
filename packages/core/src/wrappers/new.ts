import { Context } from "../injector";
import { WrapperDef } from "../interfaces";
import { Scope } from "../scope";
import { createNewWrapper, createWrapper } from "../utils";

function wrapper(ctxData?: any): WrapperDef {
  return (injector, session, next) => {
    if (ctxData !== undefined) {
      session.setContext(new Context(ctxData));
    }
    session.setScope(Scope.TRANSIENT);
    return next(injector, session);
  }
}

export const New = createWrapper<any, false>(wrapper);

export const NewNew = createNewWrapper((ctxData?: any) => {
  return (session, next) => {
    if (ctxData !== undefined) {
      session.setContext(new Context(ctxData));
    }
    session.setScope(Scope.TRANSIENT);
    return next(session);
  }
});
