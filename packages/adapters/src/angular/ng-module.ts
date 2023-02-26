import { Injector as ADIInjector, SingletonScope } from "@adi/core";
import { ENVIRONMENT_INITIALIZER, Injector, INJECTOR, resolveForwardRef } from '@angular/core';

import { processProvider } from './provider';
import { AngularInjector } from './injector-patch';

import type { InjectionToken, ProviderType } from "@adi/core";
import type { Type, ModuleWithProviders, Provider, EnvironmentProviders, ɵInternalEnvironmentProviders, ɵɵInjectorDef } from "@angular/core";

type AngularProvider = Provider | EnvironmentProviders | ɵInternalEnvironmentProviders;
type AngularProviders = Array<AngularProvider>;

export function importModules(modules: Type<any> | ModuleWithProviders<any> | Array<Type<any> | ModuleWithProviders<any>>): { providers: Array<ProviderType> } {
  modules = Array.isArray(modules) ? modules : [modules];
  const modulesSeen: Set<any> = new Set();
  const providers: Map<any, any> = new Map();
  modules.forEach(target => processNgModule(target, modulesSeen, providers));

  // convert providers
  const convertedProviders: Array<ProviderType> = [];
  // add core providers
  convertedProviders.push(...coreProviders());
  providers.forEach(provider => {
    // multi providers
    if (Array.isArray(provider)) {
      return convertedProviders.push(...provider);
    }
    convertedProviders.push(provider);
  });

  return { providers: convertedProviders };
}

const injectorField = 'ɵinj';
function processNgModule(target: Type<any> | ModuleWithProviders<any>, modulesSeen: Set<any>, providers: Map<any, any>) {
  let moduleTarget = resolveForwardRef(target);
  let moduleProviders: AngularProviders | undefined;
  if ('ngModule' in target) {
    moduleTarget = resolveForwardRef(target.ngModule);
    moduleProviders = target.providers;
  }

  if (modulesSeen.has(moduleTarget)) {
    return processProviders(moduleProviders, providers);
  }
  modulesSeen.add(moduleTarget);

  const injectableDef: ɵɵInjectorDef<any> = moduleTarget[injectorField];
  if (injectableDef) {
    // traverse on all imports
    injectableDef.imports.forEach(imported => processNgModule(imported, modulesSeen, providers));
    // process all providers
    processProviders(injectableDef.providers, providers);
    // add module class as provider
    processProviders([
      { provide: moduleTarget as Type<any>, useClass: moduleTarget as Type<any> },
      { provide: ENVIRONMENT_INITIALIZER, useExisting: moduleTarget, multi: true },
    ], providers);
  }
}

function processProviders(providers: AngularProviders = [], collection: Map<any, any>) {
  for (let provider of providers) {
    if (isEnvironmentProviders(provider)) {
      provider = provider.ɵproviders;
    }
    if (Array.isArray(provider)) {
      return processProviders(provider, collection);
    }

    const { provider: processed, multi } = processProvider(provider);
    const token = processed.provide;
    if (multi) {
      const multiProviders = collection.get(token);
      if (!multiProviders) {
        collection.set(token, [processed]);
      } else if (!Array.isArray(multiProviders)) {
        throw new Error('multi mismatch');
      } else {
        multiProviders.push(processed);
      }
    }
    collection.set(token, processed);
  }
}

function isEnvironmentProviders(provider: AngularProvider): provider is ɵInternalEnvironmentProviders {
  return provider && !!(provider as ɵInternalEnvironmentProviders).ɵproviders;
}

function coreProviders(): Array<ProviderType> {
  return [
    { provide: Injector, useClass: AngularInjector, inject: [ADIInjector], scope: SingletonScope },
    { provide: INJECTOR as InjectionToken, useExisting: Injector },
  ];
}
