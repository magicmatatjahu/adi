import { overrideInjections } from '@adi/core/lib/injector';
import { OVERRIDE_KEY } from '../hooks';

import type { ADIPlugin, Injector, Session, FactoryDefinitionClass, FactoryDefinitionFactory, InjectionItem, Injections } from '@adi/core';

export function overridesPlugin(): ADIPlugin {
  return {
    name: 'adi:plugin:overrides',
    install(adi, { unsubscribers }) {
      unsubscribers.push(
        adi.on('provider:create', ({ definition }) => {
          if (!definition) {
            return;
          }
        
          const factory: FactoryDefinitionClass | FactoryDefinitionFactory = definition.factory;
          const data = factory?.data;
          const originalInject = data?.inject;
          if (!originalInject) {
            return;
          }
    
          const target = (data as FactoryDefinitionClass['data']).class || (data as FactoryDefinitionFactory['data']).factory;
          const resolver = factory.resolver;
          factory.resolver = (injector: Injector, session: Session, data: any) => {
            const overrides = session.annotations[OVERRIDE_KEY] as Array<InjectionItem | undefined> | Injections;
            if (overrides) {
              const inject = overrideInjections(originalInject, overrides, target);
              return resolver(injector, session, { ...data, inject });
            }
            return resolver(injector, session, data);
          }
        })
      );
    }
  }
}
