import { createHook } from "./hook";
import { SessionFlag } from "../enums";
import { wait } from "../utils";
import { DESTROY_HOOKS_KEY } from "../utils/lifecycle-hooks";

export const OnDestroyLifecycle = createHook((hook: (value: any) => void | Promise<void>) => {
  return (session, next) => {
    if (session.hasFlag(SessionFlag.DRY_RUN)) {
      return next(session);
    }

    return wait(
      next(session),
      value => {
        const instance = session.ctx.instance;
        const hooks = instance.meta[DESTROY_HOOKS_KEY] || (instance.meta[DESTROY_HOOKS_KEY] = []);
        hooks.push(hook);
        return value;
      }
    );
  }
}, { name: 'adi:hook:on-destroy-lifecycle' });
