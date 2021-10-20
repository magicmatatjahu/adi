import { Context } from "../injector";
import { WrapperDef } from "../interfaces";
import { createNewWrapper, createWrapper } from "../utils/wrappers";

function wrapper(ctx: Context): WrapperDef {
  return (injector, session, next) => {
    session.setContext(ctx);
    return next(injector, session);
  }
}

export const Ctx = createWrapper<Context, true>(wrapper);

export const NewCtx = createNewWrapper((ctx: Context) => {
  return (session, next) => {
    session.setContext(ctx);
    return next(session);
  }
});
