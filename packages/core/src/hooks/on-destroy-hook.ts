import { createHook } from "./hook";
import { wait } from "../utils";

import { destroyHooksMetaKey } from "../private";

export const OnDestroyHook = createHook((hook: (value: any) => void | Promise<void>) => {
  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    return wait(
      next(session),
      value => {
        const instance = session.context.instance;
        const hooks = instance.meta[destroyHooksMetaKey] || (instance.meta[destroyHooksMetaKey] = []);
        hooks.push(hook);
        return value;
      }
    );
  }
}, { name: 'adi:hook:on-destroy-hook' });