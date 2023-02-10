import { injectEnhancers } from '../enhancers/apply';

import type { InstallPlugin } from '@adi/core';

export interface EnhancersPluginOptions {}

export function enhancersPlugin(): InstallPlugin {
  return (adi) => {
    adi.on('provider:create', ({ definition }) => {
      if (!definition) {
        return;
      }
      injectEnhancers(definition);
    });
  }
}
