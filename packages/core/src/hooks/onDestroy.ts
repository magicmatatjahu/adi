import { createHook } from "./hook";
import { SessionFlag } from "../enums";
import { wait } from "../utils";
import { destroyHooksMetaKey } from "../utils";

export const OnDestroyLifecycle = createHook((hook: (value: any) => void | Promise<void>) => {
  return (session, next) => {
    if (session.hasFlag(SessionFlag.DRY_RUN)) {
      return next(session);
    }

    return wait(
      next(session),
      value => {
        const instance = session.ctx.instance;
        const hooks = instance.meta[destroyHooksMetaKey] || (instance.meta[destroyHooksMetaKey] = []);
        hooks.push(hook);
        return value;
      }
    );
  }
}, { name: 'adi:hook:on-destroy-lifecycle' });
