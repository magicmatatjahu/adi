import { wait, Session } from '@adi/core';
import { injectableDefinitions, injectArray } from '@adi/core/lib/injector';
import { getAllKeys } from '@adi/core/lib/utils';
import { providesDefinitions } from '../decorators/provides';

import type { ADIPlugin, Injector, ClassType, AbstractClassType, InjectionArgument } from '@adi/core';

function createProviders(injector: Injector, useRegistry: ClassType | AbstractClassType) {
  const definition = providesDefinitions.get(useRegistry);
  if (!definition) {
    return;
  }

  let injections: Record<string | symbol, InjectionArgument[]>;
  let staticInjections: Record<string | symbol, InjectionArgument[]>;
  const injectableInjections = injectableDefinitions.get(useRegistry)?.injections;
  if (injectableInjections) {
    injections = injectableInjections.methods;
    staticInjections = injectableInjections.static?.methods || {};
  } else {
    injections = staticInjections = {} as any;
  }

  const prototypeProvides = definition.prototype;
  const keys = getAllKeys(prototypeProvides);
  if (keys.length) {
    injector.provide(useRegistry as ClassType);

    keys.forEach(methodName => {
      const provide = prototypeProvides[methodName];
      const inject = injections[methodName] || [];

      injector.provide({
        useFactory(instance: any, session: Session) {
          return wait(
            injectArray(injector, inject, session),
            deps => instance[methodName].apply(instance, deps),
          );
        },
        inject: [useRegistry, Session],
        ...provide as any,
      });
    });
  }

  const staticProvides = definition.static;
  getAllKeys(staticProvides).forEach(methodName => {
    const provide = staticProvides[methodName];
    const inject = staticInjections[methodName] || [];

    injector.provide({
      useFactory(session: Session) {
        return wait(
          injectArray(injector, inject, session),
          deps => useRegistry[methodName].apply(useRegistry, deps),
        );
      },
      inject: [Session],
      ...provide as any,
    });
  });
}

export function registryProviderPlugin(): ADIPlugin {
  return {
    name: 'adi:plugin:registry-provider',
    install(adi, { unsubscribers }) {
      unsubscribers.push(
        adi.on('provider:create', ({ injector, original }) => {
          if (typeof original !== 'object' || !original.useRegistry) {
            return;
          }
          createProviders(injector, original.useRegistry);
        })
      );
    }
  }
}
