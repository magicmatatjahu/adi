import { injectEnhancers } from '../enhancers/apply';

import type { ADIPlugin } from '@adi/core';

export interface EnhancersPluginOptions {}

export function enhancersPlugin(): ADIPlugin {
  return {
    name: 'adi:plugin:enhancers',
    install(adi, { unsubscribers }) {
      unsubscribers.push(
        adi.on('provider:create', ({ definition }) => {
          if (!definition) {
            return;
          }
          injectEnhancers(definition);
        }),
      );
    }
  }
}
