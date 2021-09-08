import { Injector, Session } from "../injector";
import { NextWrapper, WrapperDef } from "../interfaces";
import { NULL_REF, DELEGATION } from "../constants";
import { createWrapper } from "../utils/wrappers";

interface DelegateOptions {
  type: 'single' | 'multiple',
  values: object;
}

function retrieveDeepSessionMetadata(session: Session, key: string) {
  while (session.hasOwnProperty(key) === false && session.parent) {
    session = session.parent || NULL_REF as any;
  }
  if (session.hasOwnProperty(key)) {
    return session[key];
  }
  return NULL_REF;
}

function wrapper(arg: string): WrapperDef {
  return function(injector: Injector, session: Session, next: NextWrapper) {
    const delegate = retrieveDeepSessionMetadata(session, DELEGATION.KEY);
    // delegate isn't set
    if (delegate === NULL_REF) {
      return next(injector, session);
    }
    session.setSideEffect(true);
    const { type, values } = delegate as DelegateOptions;
    return type === 'single' ? values : values[arg];
  }
}

export const Delegate = createWrapper<undefined, false>(wrapper);