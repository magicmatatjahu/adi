import { Session } from "../injector";
import { NULL_REF, DELEGATION } from "../constants";
import { createWrapper } from "../utils/wrappers";

// interface DelegateOptions {
//   type: 'single' | 'multiple',
//   values: object;
// }

function retrieveDeepSessionMetadata(session: Session, key: string) {
  while (session.meta?.[DELEGATION.KEY] === undefined && session.parent) {
    session = session.parent;
  }
  return session.meta?.[DELEGATION.KEY]
}

export const Delegate = createWrapper((key: string | symbol | number = DELEGATION.DEFAULT) => {
  return function(session, next) {
    const delegate = retrieveDeepSessionMetadata(session, DELEGATION.KEY);
    
    // delegate isn't set
    if (delegate === undefined) {
      return next(session);
    }

    session.setSideEffect(true);
    return delegate[key];
    // const { type, values } = delegate as DelegateOptions;
    // return type === 'single' ? values : values[key];
  }
}, { name: "Delegate" });