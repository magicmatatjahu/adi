import { Injector, Session } from "../injector";
import { NextWrapper } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  session.setAsync(true);
  return next(injector, session);
}

export const Async = createWrapper<undefined, false>(() => wrapper);
