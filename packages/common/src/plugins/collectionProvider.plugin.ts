import { wait, Session } from '@adi/core';
import { injectableDefinitions, injectArray } from '@adi/core/lib/injector';
import { getAllKeys } from '@adi/core/lib/utils';
import { providesDefinitions } from '../decorators/provides';

import type { ADIPlugin, Injector, ClassType, AbstractClassType, InjectionArgument } from '@adi/core';

function createProviders(injector: Injector, useCollection: ClassType | AbstractClassType) {
  const definition = providesDefinitions.get(useCollection);
  if (!definition) {
    return;
  }

  let injections: Record<string | symbol, InjectionArgument[]>;
  let staticInjections: Record<string | symbol, InjectionArgument[]>;
  const injectableInjections = injectableDefinitions.get(useCollection)?.injections;
  if (injectableInjections) {
    injections = injectableInjections.methods;
    staticInjections = injectableInjections.static?.methods || {};
  } else {
    injections = staticInjections = {} as any;
  }

  const prototypeProvides = definition.prototype;
  const keys = getAllKeys(prototypeProvides);
  if (keys.length) {
    injector.provide(useCollection as ClassType);

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
        inject: [useCollection, Session],
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
          deps => useCollection[methodName].apply(useCollection, deps),
        );
      },
      inject: [Session],
      ...provide as any,
    });
  });
}

export function collectionProviderPlugin(): ADIPlugin {
  return {
    name: 'adi:plugin:collectionProvider',
    install(adi, { unsubscribers }) {
      unsubscribers.push(
        adi.on('provider:create', ({ injector, original }) => {
          if (typeof original !== 'object' || !original.useCollection) {
            return;
          }
          createProviders(injector, original.useCollection);
        })
      );
    }
  }
}
