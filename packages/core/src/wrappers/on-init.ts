import { SessionStatus } from "../enums";
import { InjectorResolver } from "../injector";
import { StandaloneOnInit } from "../interfaces";
import { createWrapper } from "../utils";

export const OnInitHook = createWrapper((hook: StandaloneOnInit) => {
  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }

    const onInit = InjectorResolver.createFunction(hook.onInit, hook);
    const hooks = (session.meta.initHooks || (session.meta.initHooks  = []));
    hooks.push(onInit);

    return next(session);
  }
}, { name: 'OnInitHook' });
