import { createWrapper } from "@adi/core";

import { DELEGATION } from "../constants";

export const Delegations = createWrapper((delegations: Record<string | symbol, any>) => {
  return (session, next) => {
    session.meta[DELEGATION.KEY] = delegations;
    return next(session);
  }
}, { name: "Delegations" });
