import { createHook } from "./hook";

import { initHooksMetaKey } from "../private";

export const OnInitHook = createHook((hook: (value: any) => void | Promise<void>) => {
  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    const hooks = session.annotations[initHooksMetaKey] || (session.annotations[initHooksMetaKey] = []);
    hooks.push(hook);
    return next(session);
  }
}, { name: 'adi:hook:on-init-hook' });