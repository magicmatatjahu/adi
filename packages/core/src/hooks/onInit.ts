import { createHook } from "./hook";
import { SessionFlag } from "../enums";
import { INIT_HOOKS_KEY } from "../utils/lifecycle-hooks";

export const OnInitLifecycle = createHook((hook: (value: any) => void | Promise<void>) => {
  return (session, next) => {
    if (session.hasFlag(SessionFlag.DRY_RUN)) {
      return next(session);
    }

    const hooks = session.meta[INIT_HOOKS_KEY] || (session.meta[INIT_HOOKS_KEY] = []);
    hooks.push(hook);
    return next(session);
  }
}, { name: 'adi:hook:on-init-lifecycle' });
