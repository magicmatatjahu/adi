import { SessionStatus } from "../enums";
import { StandaloneOnDestroy } from "../interfaces";
import { createWrapper, thenable } from "../utils";

export const OnDestroyHook = createWrapper((hook: StandaloneOnDestroy) => {
  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }

    return thenable(
      () => next(session),
      value => {
        const instance = session.instance as any;
        const hooks = (instance.destroyHooks || (instance.destroyHooks = []));
        hooks.push(hook);
        return value;
      }
    );
  }
});