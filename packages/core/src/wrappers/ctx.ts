import { Context } from "../injector";
import { createWrapper } from "../utils/wrappers";

export const Ctx = createWrapper((ctx: Context) => {
  return (session, next) => {
    session.setContext(ctx);
    return next(session);
  }
});
