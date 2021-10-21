import { Session } from "../injector";
import { NextWrapper } from "../interfaces";
import { createWrapper, thenable } from "../utils";

function wrapper(session: Session, next: NextWrapper) {
  return thenable(
    () => next(session),
    value => {
      session.setSideEffect(true);
      return value;
    }
  );
}

export const SideEffects = createWrapper(() => wrapper);