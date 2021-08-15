import { Context } from "../injector";
import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";
import { createWrapper as cr } from "../utils/wrappers.new";

function wrapper(ctxOrData: Context | any): WrapperDef {
  const ctx = ctxOrData instanceof Context ? ctxOrData : new Context(ctxOrData);
  return (injector, session, next) => {
    session.setContext(ctx);
    return next(injector, session);
  }
}

export const NewCtx = cr<Context, true>(wrapper);
export const Ctx = createWrapper(wrapper);