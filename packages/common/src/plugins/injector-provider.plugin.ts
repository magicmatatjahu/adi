import { Injector, wait } from '@adi/core';
import { injectableDefinitions } from '@adi/core/lib/injector';

import type { Plugin, ModuleImportType, ProviderType, InjectionToken } from '@adi/core';

export const providerInjectorMetaKey = Symbol.for('adi:key:provider-injector');

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
          imports = imports || [];
          providers = providers || [];

          const originalResolver = factory.resolver;
          factory.resolver = (injector, session, data) => {
            const instance = session.instance!;
            instance.onDestroy(() => instance.meta[providerInjectorMetaKey]?.destroy());

            return wait(
              Injector.create({ imports, providers }, { exporting: false }, injector).init(),
              subInjector => {
                instance.meta[providerInjectorMetaKey] = subInjector;
                return originalResolver(subInjector, session, data);
              },
            );
          }
        }
      });
    }
  }
}
