import { WrapperDef } from "../interfaces";
import { createNewWrapper, createWrapper } from "../utils/wrappers";
import { DELEGATION } from "../constants";

function wrapper(delegations: Record<string | symbol, any>): WrapperDef {
  return (injector, session, next) => {
    session[DELEGATION.KEY] = {
      type: 'multiple',
      values: delegations,
    };
    return next(injector, session);
  }
}

export const Delegations = createWrapper<Record<string | symbol, any>, true>(wrapper);

export const NewDelegations = createNewWrapper((delegations: Record<string | symbol, any>) => {
  return (session, next) => {
    session[DELEGATION.KEY] = {
      type: 'multiple',
      values: delegations,
    };
    return next(session);
  }
});
