import { createHook } from "./hook";
import { wait, isProviderToken } from "../utils";

import type { ProviderToken } from "../interfaces";

export const Config = createHook((options?: { token?: ProviderToken }) => {
  let anotherToken = options?.token !== undefined;

  return (session, next) => {
    if (anotherToken) {
      session.iOptions.token = options.token;
    }

    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    const forked = session.fork();
    forked.setFlag('dry-run');

    return wait(
      next(forked),
      () => {
        const config = forked.context.definition.annotations.config;
        if (isProviderToken(config)) {
          session.iOptions.token = config;
          return next(session);
        }
        return config;
      },
    );
  }
}, { name: 'adi:hook:config' });
