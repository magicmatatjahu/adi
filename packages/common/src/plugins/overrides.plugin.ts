import { OVERRIDE_KEY } from '../hooks';

import type { InstallPlugin } from '@adi/core';

export function overridesPlugin(): InstallPlugin {
  return (adi) => {
    adi.on('provider:create', ({ definition }) => {
      if (!definition) {
        return;
      }
    
      const factory = definition.factory;
      const injections = factory?.data?.inject;
      if (!injections) {
        return;
      }

      const resolver = factory.resolver;
      factory.resolver = (injector, session, data) => {
        const overrides = session.annotations[OVERRIDE_KEY];
        if (!overrides) {
          return resolver(injector, session, data);
        }
        return resolver(injector, session, data);
      }
    });
  }
}
