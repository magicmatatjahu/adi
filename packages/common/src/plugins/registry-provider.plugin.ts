import { wait, Session } from '@adi/core';
import { injectableDefinitions, injectArray } from '@adi/core/lib/injector';
import { getAllKeys } from '@adi/core/lib/utils';
import { providesDefinitions } from '../decorators/provides';

import type { Plugin, Injector, ClassType, AbstractClassType, InjectionArgument } from '@adi/core';
import type { RegistryProvider } from '../types';

function createRegistryProviders(injector: Injector, useRegistry: ClassType | AbstractClassType) {
  const definition = providesDefinitions.get(useRegistry);
  if (!definition) {
    return;
  }

  let injections: Record<string | symbol, Array<InjectionArgument | undefined>>;
  let staticInjections: Record<string | symbol, Array<InjectionArgument | undefined>>;
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

export function registryProviderPlugin(): Plugin {
  return {
    name: 'adi:registry-provider',
    install(_, { on }) {
      on('provider:add', ({ original }, { injector }) => {
        const useRegistry: ClassType | AbstractClassType = (original as RegistryProvider)?.useRegistry
        if (!useRegistry) {
          return;
        }
        createRegistryProviders(injector, useRegistry);
      })
    }
  }
}
