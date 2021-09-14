import { StandaloneOnDestroy, WrapperDef } from "../interfaces";
import { createWrapper, thenable } from "../utils";

function wrapper<T>(hook: StandaloneOnDestroy<T>): WrapperDef {
  return (injector, session, next) => {
    return thenable(
      () => next(injector, session),
      value => {
        const instance = session.instance as any;
        const hooks = (instance.destroyHooks || (instance.destroyHooks = []));
        hooks.push(hook);
        return value;
      }
    );
  }
}

export const OnDestroyHook = createWrapper<StandaloneOnDestroy, false>(wrapper);
