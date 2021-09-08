import { SESSION_INTERNAL } from "../constants";
import { StandaloneOnInit, WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper<T>(hook: StandaloneOnInit<T>): WrapperDef {
  return (injector, session, next) => {
    const hooks = (session[SESSION_INTERNAL.ON_INIT_HOOKS] || (session[SESSION_INTERNAL.ON_INIT_HOOKS] = []));
    hooks.push(hook);
    return next(injector, session);
  }
}

export const OnInitHook = createWrapper<StandaloneOnInit, true>(wrapper);