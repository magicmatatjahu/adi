import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils/wrappers";

function wrapper(delegations: Record<string | symbol, any>): WrapperDef {
  return (injector, session, next) => {
    session['$$delegate'] = {
      type: 'multiple',
      values: delegations,
    };
    return next(injector, session);
  }
}

export const Delegations = createWrapper<Record<string | symbol, any>, true>(wrapper);
