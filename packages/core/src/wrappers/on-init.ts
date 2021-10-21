import { SESSION_INTERNAL } from "../constants";
import { StandaloneOnInit } from "../interfaces";
import { createWrapper } from "../utils";

export const OnInitHook = createWrapper((hook: StandaloneOnInit) => {
  return (session, next) => {
    const hooks = (session[SESSION_INTERNAL.ON_INIT_HOOKS] || (session[SESSION_INTERNAL.ON_INIT_HOOKS] = []));
    hooks.push(hook);
    return next(session);
  }
});
