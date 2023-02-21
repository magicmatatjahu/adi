import { createHook, wait } from '@adi/core';
import { InstanceStatus } from '@adi/core/lib/enums';
import { DYNAMIC_CONTEXT } from '../constants';

import type { ADIPlugin, ProviderDefinition } from '@adi/core';

const dynamicScopeValue = {};

function setDynamicInstance(definition: ProviderDefinition): void {
  definition.values.set(DYNAMIC_CONTEXT, {
    definition,
    context: DYNAMIC_CONTEXT,
    value: dynamicScopeValue,
    status: InstanceStatus.RESOLVED,
    scope: definition.scope,
    session: null,
    parents: undefined,
    links: undefined,
    meta: {},
  });
}

const DynamicScopesHook = createHook(() => {
  return (session, next) => {
    return wait(
      next(session),
      value => {
        if (session.hasFlag('dynamic-scope')) {
          
        }
        return value;
      }
    )
  }
}, { name: 'adi:hook:dynamic-scopes' });

const hook = DynamicScopesHook();

export function dynamicScopesPlugin(): ADIPlugin {
  return {
    name: 'adi:plugin:cache',
    install(adi, { unsubscribers }) {
      unsubscribers.push(
        adi.on('provider:create', ({ definition }) => {
          setDynamicInstance(definition);
        }),
      );

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
