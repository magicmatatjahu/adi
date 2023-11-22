import { Injector, Session, wait, OnDestroyHook } from '@adi/core';
import { injectableDefinitions } from '@adi/core/lib/injector';

import type { Plugin, ModuleImportType, ProviderType, InjectionToken } from '@adi/core';

const providerInjectorMetaKey = 'adi:key:provider-injector';

const DestroyInjectorHook = OnDestroyHook({
  onDestroy(_: any, session: Session) {
    const hostInjector: Injector = session.instance?.meta[providerInjectorMetaKey];
    return hostInjector && hostInjector.destroy();
  },
  inject: [Session]
});

export function injectorProviderPlugin(): Plugin {
  return {
    name: 'adi:injector-provider',
    install(_, { on }) {
      on('provider:add', ({ definition, original }) => {
        if (!definition) {
          return;
        }
      
        const factory = definition.factory;
        const injections = factory?.data?.inject;
        if (!injections) {
          return;
        }
      
        let imports: Array<ModuleImportType> | undefined;
        let providers: Array<ProviderType> | undefined;
        if (typeof original === 'function') {
          const def = injectableDefinitions.get(original);
          if (!def) {
            return;
          }
      
          const options = def.options;
          imports = options.imports;
          providers = options.providers;
        } else {
          imports = (original as Exclude<ProviderType, InjectionToken>).imports;
          providers = (original as Exclude<ProviderType, InjectionToken>).providers;
        }
      
        if (imports || providers) {
          // add destroy hook to destroy Injector.create 
          definition.hooks.push(DestroyInjectorHook);
          
          imports = imports || [];
          providers = providers || [];
          const resolver = factory.resolver;
          factory.resolver = (injector, session, data) => {
            return wait(
              Injector.create({ imports, providers }, { exporting: false }, injector).init(),
              newInjector => {
                session.instance!.meta[providerInjectorMetaKey] = newInjector;
                return resolver(newInjector, session, data);
              },
            );
          }
        }
      });
    }
  }
}