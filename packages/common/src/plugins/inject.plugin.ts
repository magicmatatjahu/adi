import { setCurrentInjector } from '../inject';

import type { ADIPlugin } from '@adi/core';

export function injectPlugin(): ADIPlugin {
  return {
    name: 'adi:plugin:inject',
    install(adi, { unsubscribers }) {
      unsubscribers.push(
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
            const previousInjector = setCurrentInjector(injector);
            try {
              return resolver(injector, session, data);
            } finally {
              setCurrentInjector(previousInjector);
            }
          }
        })
      );
    }
  }
}
