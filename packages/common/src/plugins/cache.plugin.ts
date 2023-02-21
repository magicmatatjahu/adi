import { Cache, createSubCache, destroySubCache } from '../hooks';

import type { ADIPlugin } from '@adi/core';

const hook = Cache();

export function cachePlugin(): ADIPlugin {
  return {
    name: 'adi:plugin:dynamic-scopes',
    install(adi, { unsubscribers }) {
      adi.injectors.forEach(createSubCache);

      unsubscribers.push(
        adi.on('module:create', ({ injector }) => {
          injector.provide({
            hooks: hook,
            annotations: {
              order: -2137,
            }
          });
        }),
      );

      unsubscribers.push(
        adi.on('module:create', ({ injector }) => {
          createSubCache(injector);
        }),
      );
      unsubscribers.push(
        adi.on('module:destroy', ({ injector }) => {
          destroySubCache(injector);
        }),
      );
    },
  }
}
