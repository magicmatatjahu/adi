import { Injector, Session } from "../injector";
import { NextWrapper } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  const value = next(injector, session);
  session.setSideEffect(false);
  return value;
}

export const Memo = createWrapper<undefined, false>(() => wrapper);