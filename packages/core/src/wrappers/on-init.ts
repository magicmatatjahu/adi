import { SESSION_INTERNAL } from "../constants";
import { SessionStatus } from "../enums";
import { InjectorResolver } from "../injector";
import { FactoryDef, StandaloneOnInit } from "../interfaces";
import { createWrapper } from "../utils";
import { Delegate } from "./delegate";

export const OnInitHook = createWrapper((hook: StandaloneOnInit) => {
  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }
    const hooks = (session[SESSION_INTERNAL.ON_INIT_HOOKS] || (session[SESSION_INTERNAL.ON_INIT_HOOKS] = []));

    let factory: FactoryDef;
    if (typeof hook === 'function') {
      factory = InjectorResolver.createFactory(hook, [Delegate()]);
    } else {
      factory = InjectorResolver.createFactory(hook.onInit, hook.inject);
    }
    hooks.push(factory);

    return next(session);
  }
});
