import { SESSION_INTERNAL } from "../constants";
import { StandaloneOnDestroy, WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper<T>(hook: StandaloneOnDestroy<T>): WrapperDef {
  return (injector, session, next) => {
    const hooks = (session[SESSION_INTERNAL.ON_DESTROY_HOOKS] || (session[SESSION_INTERNAL.ON_DESTROY_HOOKS] = []));
    hooks.push(hook);
    return next(injector, session);
  }
}

export const OnDestroyHook = createWrapper<StandaloneOnDestroy, false>(wrapper);
