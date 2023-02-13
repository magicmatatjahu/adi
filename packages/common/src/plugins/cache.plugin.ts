import { Cache } from '../hooks';

import type { ADIPlugin } from '@adi/core';

const hook = Cache();

export function cachePlugin(): ADIPlugin {
  return {
    name: 'adi:plugin:cache',
    install(adi, { unsubscribers }) {
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
    },
  }
}
