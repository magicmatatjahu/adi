import { Injector, Session } from "../injector";
import { NewNextWrapper, NextWrapper } from "../interfaces";
import { createNewWrapper, createWrapper, thenable } from "../utils";

function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  return thenable(
    () => next(injector, session),
    value => {
      session.setSideEffect(true);
      return value;
    }
  );
}

export const SideEffects = createWrapper<undefined, false>(() => wrapper);

function newWrapper(session: Session, next: NewNextWrapper) {
  return thenable(
    () => next(session),
    value => {
      session.setSideEffect(true);
      return value;
    }
  );
}

export const NewSideEffects = createNewWrapper(() => newWrapper);