import { createHook } from "./hook";
import { SessionFlag } from "../enums";
import { initHooksMetaKey } from "../utils";

export const OnInitLifecycle = createHook((hook: (value: any) => void | Promise<void>) => {
  return (session, next) => {
    if (session.hasFlag(SessionFlag.DRY_RUN)) {
      return next(session);
    }

    const hooks = session.meta[initHooksMetaKey] || (session.meta[initHooksMetaKey] = []);
    hooks.push(hook);
    return next(session);
  }
}, { name: 'adi:hook:on-init-lifecycle' });
