import { PORTAL_KEY, Portal } from '../hooks/portal';

import type { Plugin, Injector, Session, FactoryDefinitionClass, FactoryDefinitionFactory } from '@adi/core';

export interface PortalPluginOptions {
  global?: boolean | {
    deep: boolean;
    order: number;
  }
}

export function portalPlugin(options?: PortalPluginOptions): Plugin {
  const applyGlobal = options?.global || false;
  const globalDeep = typeof applyGlobal === 'object' ? applyGlobal.deep : false
  const globalOrder = typeof applyGlobal === 'object' ? applyGlobal.order : -2137

  return {
    name: 'adi:portal',
    install(_, { on }) {
      if (applyGlobal) {
        on('module:add', (_, { injector }) => {
          injector.provide({
            hooks: Portal({ deep: globalDeep }),
            annotations: {
              order: globalOrder,
            }
          });
        })
      }

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
  
        const resolver = factory.resolver;
        factory.resolver = (injector: Injector, session: Session, data: any) => {
          const annotations = session.annotations;
          let portalInjector = annotations[PORTAL_KEY] as { injector: Injector | undefined, deep: boolean };
          const context = session.context;

          if (portalInjector) {
            injector = context.injector = portalInjector.injector as Injector;
          } else if (session.parent) {
            portalInjector = session.parent.annotations[PORTAL_KEY] as { injector: Injector | undefined, deep: boolean };
            if (portalInjector) {
              injector = context.injector = portalInjector.injector as Injector;

              // defined deep portaling
              if (portalInjector.deep) {
                session.annotations[PORTAL_KEY] = portalInjector;
              }
            }
          }

          return resolver(injector, session, data);
        }
      })
    }
  }
}
