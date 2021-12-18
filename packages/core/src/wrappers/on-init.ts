import { SessionStatus } from "../enums";
import { InjectorResolver } from "../injector";
import { FactoryDef, StandaloneOnInit } from "../interfaces";
import { createWrapper } from "../utils";

export const OnInitHook = createWrapper((hook: StandaloneOnInit) => {
  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }

    let onInit: FactoryDef;
    let delegationKey: any;
    if (typeof hook === 'function') {
      onInit = InjectorResolver.createFunction(hook, undefined, true);
    } else {
      onInit = InjectorResolver.createFunction(hook.onInit, hook, true);
      delegationKey = hook.delegationKey;
    }
    const hooks = (session.meta.initHooks || (session.meta.initHooks  = []));
    hooks.push({
      onInit,
      delegationKey,
    });

    return next(session);
  }
}, { name: 'OnInitHook' });
