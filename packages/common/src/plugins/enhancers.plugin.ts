import { injectEnhancers } from '../enhancers/apply';

import type { Plugin } from '@adi/core';

export interface EnhancersPluginOptions {}

export function enhancersPlugin(): Plugin {
  return {
    name: 'adi:enhancers',
    install(_, { on }) {
      on('provider:add', ({ definition }) => {
        if (!definition) {
          return;
        }
        injectEnhancers(definition);
      });
    }
  }
}
