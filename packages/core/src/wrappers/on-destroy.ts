import { SessionStatus } from "../enums";
import { InjectorResolver } from "../injector";
import { FactoryDef, StandaloneOnDestroy } from "../interfaces";
import { createWrapper, thenable } from "../utils";
import { Delegate } from "./delegate";

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

        let factory: FactoryDef;
        if (typeof hook === 'function') {
          factory = InjectorResolver.createFactory(hook, [Delegate()]);
        } else {
          factory = InjectorResolver.createFactory(hook.onDestroy, hook.inject);
        }
        hooks.push(factory);

        return value;
      }
    );
  }
}, { name: 'OnDestroyHook' });