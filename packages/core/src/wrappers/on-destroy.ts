import { SessionStatus } from "../enums";
import { createFunction } from "../injector";
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
        const onDestroy = createFunction(hook.onDestroy, hook);
        const hooks = (session.instance.meta.destroyHooks || (session.instance.meta.destroyHooks = []));
        hooks.push(onDestroy);
        return value;
      }
    );
  }
}, { name: 'OnDestroyHook' });
