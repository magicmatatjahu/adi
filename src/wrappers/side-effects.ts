import { Injector, Session } from "../injector";
import { NextWrapper } from "../interfaces";
import { createWrapper, thenable } from "../utils";

function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  return thenable(next, injector, session).then(
    value => {
      session.setSideEffect(true);
      return value;
    }
  );
  // const value = next(injector, session);
  // session.setSideEffect(true);
  // return value;
}

export const SideEffects = createWrapper<undefined, false>(() => wrapper);
