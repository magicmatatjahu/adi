import { SessionStatus } from "../enums";
import { InjectorResolver } from "../injector";
import { FactoryDef, StandaloneOnDestroy } from "../interfaces";
import { createWrapper, thenable } from "../utils";

export const OnDestroyHook = createWrapper((hook: StandaloneOnDestroy) => {
  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }

    return thenable(
      () => next(session),
      value => {
        let onDestroy: FactoryDef;
        let delegationKey: any;
        if (typeof hook === 'function') {
          onDestroy = InjectorResolver.createFunction(hook, undefined, true);
        } else {
          onDestroy = InjectorResolver.createFunction(hook.onDestroy, hook, undefined);
          delegationKey = hook.delegationKey;
        }
        const hooks = (session.instance.meta.destroyHooks || (session.instance.meta.destroyHooks = []));
        hooks.push({
          onDestroy,
          delegationKey,
        });

        return value;
      }
    );
  }
}, { name: 'OnDestroyHook' });
