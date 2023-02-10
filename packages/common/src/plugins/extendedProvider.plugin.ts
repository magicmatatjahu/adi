import { Injector, Session, wait, OnDestroyHook } from '@adi/core';
import { injectableDefinitions } from '@adi/core/lib/injector';

import type { InstallPlugin, ModuleImportType, ProviderType } from '@adi/core';

const DestroyInjectorHook = OnDestroyHook({
  onDestroy(_: any, session: Session) {
    const hostInjector: Injector = session.context.instance.meta.hostInjector;
    return hostInjector.destroy();
  },
  inject: [Session]
});

export function extendedProviderPlugin(): InstallPlugin {
  return (adi) => {
    adi.on('provider:create', ({ definition, original }) => {
      if (!definition) {
        return;
      }

      const factory = definition.factory;
      const injections = factory?.data?.inject;
      if (!injections) {
        return;
      }

      let imports: Array<ModuleImportType>;
      let providers: Array<ProviderType>;
      if (typeof original === 'function') {
        const def =  injectableDefinitions.get(original);
        if (!def) {
          return;
        }

        const provide = def.options.provide;
        imports = provide.imports;
        providers = provide.providers;
      } else {
        imports = original.imports;
        providers = original.providers;
      }

      if (imports || providers) {
        // add destroy hook to destroy new injector 
        definition.hooks.push(DestroyInjectorHook);
        
        const resolver = factory.resolver;
        factory.resolver = (injector, session, data) => {
          return wait(
            Injector.create({ imports, providers }, { exporting: 'disabled' }, injector).init(),
            newInjector => {
              session.context.instance.meta.hostInjector = newInjector;
              return resolver(newInjector, session, data);
            },
          );
        }
      }
    });
  }
}
