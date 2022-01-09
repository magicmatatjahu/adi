import { createWrapper, Session } from "@adi/core";

import { DELEGATION } from "../constants";

function retrieveDelegation(session: Session, key: string) {
  while (session.meta?.[DELEGATION.KEY] === undefined && session.parent) {
    session = session.parent;
  }
  return session.meta?.[DELEGATION.KEY]
}

export const Delegate = createWrapper((key: string | symbol | number = DELEGATION.DEFAULT) => {
  return function(session, next) {
    const delegate = retrieveDelegation(session, DELEGATION.KEY);
    
    // delegate isn't set
    if (delegate === undefined) {
      return next(session);
    }

    session.setSideEffect(true);
    return delegate[key];
  }
}, { name: "Delegate" });
