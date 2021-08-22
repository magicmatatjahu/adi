import { Injector, Session } from "../injector";
import { NextWrapper } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  session.setAsync(false);
  return next(injector, session);
}

export const Sync = createWrapper<undefined, false>(() => wrapper);
