import { Cache } from '../hooks';

import type { InstallPlugin } from '@adi/core';

export function cachePlugin(): InstallPlugin {
  return (adi) => {
    adi.on('module:create', ({ injector }) => {
      injector.provide({
        hooks: Cache(),
        annotations: {
          order: -2137,
        }
      });
    });
  }
}
