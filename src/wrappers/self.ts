import { Injector, NilInjector, Session } from "../injector";
import { NextWrapper } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  const token = session.getToken();
  // check for treeshakable provider
  injector.getRecord(token);
  
  if ((injector as any).records.has(token)) {
    return next(injector, session);
  }
  // if token is not found
  return next(NilInjector, session);
}

export const Self = createWrapper<undefined, false>(() => wrapper);
