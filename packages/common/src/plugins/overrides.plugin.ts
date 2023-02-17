import { overrideInjections } from '@adi/core/lib/injector';
import { OVERRIDE_KEY, PORTAL_KEY } from '../hooks';

import type { ADIPlugin, Injector, Session, FactoryDefinitionClass, FactoryDefinitionFactory, InjectionItem, Injections } from '@adi/core';

export interface OverridesPluginOptions {
  overrides?: boolean;
  portal?: boolean
} 

const defaultOptions: OverridesPluginOptions = { overrides: true, portal: false };

export function overridesPlugin(options: OverridesPluginOptions = {}): ADIPlugin {
  options = { ...defaultOptions, ...options };

  return {
    name: 'adi:plugin:overrides',
    install(adi, { unsubscribers }) {
      if (!options.overrides && !options.portal) {
        return;
      }

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
            const annotations = session.annotations;

            if (options.portal) {
              let portalInjector = annotations[PORTAL_KEY] as { injector: Injector | undefined, deep: boolean };

              if (portalInjector !== undefined) {
                injector = session.context.injector = portalInjector.injector;
              } else if (session.parent) {
                let portalInjector = session.parent.annotations[PORTAL_KEY] as { injector: Injector | undefined, deep: boolean };
                if (portalInjector !== undefined) {
                  injector = session.context.injector = portalInjector.injector;
                }
              }
            }

            if (options.overrides) {
              const overrides = annotations[OVERRIDE_KEY] as Array<InjectionItem | undefined> | Injections | undefined;
              if (overrides !== undefined) {
                const inject = overrideInjections(originalInject, overrides, target);
                return resolver(injector, session, { ...data, inject });
              }
            }

            return resolver(injector, session, data);
          }
        })
      );
    }
  }
}
