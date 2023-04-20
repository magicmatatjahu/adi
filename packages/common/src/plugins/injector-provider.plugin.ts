import { Injector, Session, wait, OnDestroyHook } from '@adi/core';
import { injectableDefinitions } from '@adi/core/lib/injector';

import type { ADIPlugin, ModuleImportType, ProviderType, OnProviderCreateEvent } from '@adi/core';

const providerInjectorMetaKey = 'adi:key:provider-injector';

const DestroyInjectorHook = OnDestroyHook({
  onDestroy(_: any, session: Session) {
    const hostInjector: Injector = session.context.instance.meta[providerInjectorMetaKey];
    return hostInjector && hostInjector.destroy();
  },
  inject: [Session]
});

function onProviderCreate({ definition, original }: OnProviderCreateEvent) {
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
    const def = injectableDefinitions.get(original);
    if (!def) {
      return;
    }

    const options = def.options;
    imports = options.imports;
    providers = options.providers;
  } else {
    imports = original.imports;
    providers = original.providers;
  }

  if (imports || providers) {
    // add destroy hook to destroy new injector 
    definition.hooks.push(DestroyInjectorHook);
    
    imports = imports || [];
    providers = providers || [];
    const resolver = factory.resolver;
    factory.resolver = (injector, session, data) => {
      return wait(
        Injector.create({ imports, providers }, { exporting: false }, injector).init(),
        newInjector => {
          session.context.instance.meta[providerInjectorMetaKey] = newInjector;
          return resolver(newInjector, session, data);
        },
      );
    }
  }
}

export function injectorProviderPlugin(): ADIPlugin {
  return {
    name: 'adi:plugin:injector-provider',
    install(adi, { unsubscribers }) {
      unsubscribers.push(
        adi.on('provider:create', onProviderCreate),
      )
    }
  }
}