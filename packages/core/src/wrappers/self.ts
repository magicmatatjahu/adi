import { NilInjector, Session } from "../injector";
import { NextWrapper } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(session: Session, next: NextWrapper) {
  const token = session.getToken();
  const injector = session.injector;
  
  // check for treeshakable provider
  injector.getRecord(token);
  
  if (injector.records.has(token)) {
    return next(session);
  }
  // if token is not found
  return NilInjector.get(token);
}

export const Self = createWrapper(() => wrapper);
