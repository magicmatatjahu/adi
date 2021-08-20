import { Injector, Session } from "../injector";
import { NextWrapper, WrapperDef } from "../interfaces";
import { NULL_REF } from "../constants";
import { createWrapper } from "../utils/wrappers";

interface DelegateOptions {
  type: 'single' | 'multiple',
  values: object;
}

function wrapper(arg: string): WrapperDef {
  return function(injector: Injector, session: Session, next: NextWrapper) {
    const delegate = session.retrieveDeepMeta('$$delegate');
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
