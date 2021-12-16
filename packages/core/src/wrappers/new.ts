import { Context } from "../injector";
import { Scope } from "../scope";
import { createWrapper } from "../utils";

export const New = createWrapper((ctxData?: any) => {
  return (session, next) => {
    if (ctxData !== undefined) {
      session.setContext(new Context(ctxData));
    }
    session.setScope(Scope.TRANSIENT);
    return next(session);
  }
}, { name: 'New' });
