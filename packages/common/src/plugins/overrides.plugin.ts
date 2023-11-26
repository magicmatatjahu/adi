import { overrideInjections } from '@adi/core/lib/injector';

import { OVERRIDE_KEY } from '../hooks/override';

import type { Plugin, Injector, Session, FactoryDefinitionClass, FactoryDefinitionFactory, InjectionItem, Injections } from '@adi/core';

export interface OverridesPluginOptions {}

export function overridesPlugin(): Plugin {
  return {
    name: 'adi:overrides',
    install(_, { on }) {
      on('provider:add', ({ definition }) => {
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
        const originalResolver = factory.resolver;
        factory.resolver = (injector: Injector, session: Session, data: any) => {
          const overrides = session.data[OVERRIDE_KEY] as Array<InjectionItem | undefined> | Injections | undefined;
          if (!overrides) {
            return originalResolver(injector, session, data);
          }

          const inject = overrideInjections(originalInject, overrides, target);
          return originalResolver(injector, session, { ...data, inject });
        }
      })
    }
  }
}
