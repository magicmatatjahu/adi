import { createHook } from "./hook";
import { Context } from "../injector";
import { TransientScope } from "../scopes";

export const New = createHook((data: Record<string, any> = {}) => {
  return (session, next) => {
    session.iOptions.context = new Context(data || {});
    session.iOptions.scope = TransientScope;
    return next(session);
  }
}, { name: 'adi:hook:new' });
