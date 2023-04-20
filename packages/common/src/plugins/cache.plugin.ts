import { Cache, createSubCache, destroySubCache } from '../hooks';

import type { ADIPlugin, Injector } from '@adi/core';

const hook = Cache();

function onModuleCreate(injector: Injector) {
  createSubCache(injector);
  injector.provide({
    hooks: hook,
    annotations: {
      order: -2137,
    }
  });
}

export function cachePlugin(): ADIPlugin {
  return {
    name: 'adi:plugin:cache',
    install(adi, { unsubscribers }) {
      adi.injectors.forEach(onModuleCreate);

      unsubscribers.push(
        adi.on('module:create', ({ injector }) => {
          onModuleCreate(injector)
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
