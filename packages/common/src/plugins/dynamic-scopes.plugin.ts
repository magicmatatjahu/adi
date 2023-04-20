import { DynamicScopeHook } from '../scopes/dynamic.scope';

import type { ADIPlugin } from '@adi/core';

const hook = DynamicScopeHook();

export function dynamicScopesPlugin(): ADIPlugin {
  return {
    name: 'adi:plugin:dynamic-scopes',
    install(adi, { unsubscribers }) {
      unsubscribers.push(
        adi.on('module:create', ({ injector }) => {
          injector.provide({
            hooks: hook,
            annotations: {
              order: -2100,
            }
          });
        }),
      );
    },
  }
}
