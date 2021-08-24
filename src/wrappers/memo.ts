import { Injector, Session } from "../injector";
import { NextWrapper } from "../interfaces";
import { createWrapper, thenable } from "../utils";

function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  return thenable(
    () => next(injector, session),
    value => {
      session.setSideEffect(false);
      return value;
    }
  );
}

export const Memo = createWrapper<undefined, false>(() => wrapper);