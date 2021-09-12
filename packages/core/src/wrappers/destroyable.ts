import { Injector, Session } from "../injector";
import { DestroyManager } from "../injector/destroy-manager";
import { NextWrapper } from "../interfaces";
import { createWrapper, thenable } from "../utils";

function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  return thenable(
    () => next(injector, session),
    () => DestroyManager.createDestroyable(session.instance),
  );
}

export const Destroyable = createWrapper<undefined, false>(() => wrapper);
