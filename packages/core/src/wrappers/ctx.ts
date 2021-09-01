import { Context } from "../injector";
import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils/wrappers";

function wrapper(ctx: Context): WrapperDef {
  return (injector, session, next) => {
    session.setContext(ctx);
    return next(injector, session);
  }
}

export const Ctx = createWrapper<Context, true>(wrapper);
