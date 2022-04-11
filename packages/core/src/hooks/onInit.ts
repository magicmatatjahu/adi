import { createHook } from "./hook";
import { SessionFlag } from "../enums";
import { wait } from "../utils";
import { INIT_HOOKS_KEY } from "../utils/lifecycle-hooks";

export const OnInitLifecycle = createHook((hook: () => void | Promise<void>) => {
  return (session, next) => {
    if (session.hasFlag(SessionFlag.DRY_RUN)) {
      return next(session);
    }

    return wait(
      next(session),
      value => {
        const instance = session.ctx.instance;
        const hooks = instance.meta[INIT_HOOKS_KEY] || (instance.meta[INIT_HOOKS_KEY] = []);
        hooks.unshift(hook);
        return value;
      }
    );
  }
}, { name: 'adi:hook:on-init-lifecycle' });
