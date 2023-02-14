import { createHook, wait } from "@adi/core";
import { isProviderToken } from "@adi/core/lib/utils";

import type { ProviderToken } from "@adi/core";

export const Config = createHook((token?: ProviderToken) => {
  const self = !isProviderToken(token);

  return (session, next) => {
    if (self) {
      const parent = session.parent;
      if (!parent) {
        return;
      }

      const config = parent.context.definition.annotations.config;
      if (isProviderToken(config)) {
        session.iOptions.token = config;
        return next(session);
      }
      return config;
    }

    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    const forked = session.fork();
    forked.setFlag('dry-run');
    forked.iOptions.token = token;
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
