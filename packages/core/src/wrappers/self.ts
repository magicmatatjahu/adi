import { Injector, NilInjector, Session } from "../injector";
import { NewNextWrapper, NextWrapper } from "../interfaces";
import { createNewWrapper, createWrapper } from "../utils";

function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  const token = session.getToken();
  // check for treeshakable provider
  injector.getRecord(token);
  
  if (injector.records.has(token)) {
    return next(injector, session);
  }
  // if token is not found
  return next(NilInjector, session);
}

export const Self = createWrapper<undefined, false>(() => wrapper);

function newWrapper(session: Session, next: NewNextWrapper) {
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

export const NewSelf = createNewWrapper(() => newWrapper);
