import { createWrapper } from "../utils/wrappers";
import { DELEGATION } from "../constants";

export const Delegations = createWrapper((delegations: Record<string | symbol, any>) => {
  return (session, next) => {
    session[DELEGATION.KEY] = {
      type: 'multiple',
      values: delegations,
    };
    return next(session);
  }
});
