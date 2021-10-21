import { Injector, Session } from "../injector";
import { NewNextWrapper, NextWrapper } from "../interfaces";
import { createNewWrapper, createWrapper, thenable } from "../utils";

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

function newWrapper(session: Session, next: NewNextWrapper) {
  return thenable(
    () => next(session),
    value => {
      session.setSideEffect(false);
      return value;
    }
  );
}

export const NewMemo = createNewWrapper(() => newWrapper);
