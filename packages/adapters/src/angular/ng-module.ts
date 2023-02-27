import { ENVIRONMENT_INITIALIZER, resolveForwardRef, inject } from '@angular/core';

import { processProviders, coreProviders } from './provider';

import type { ProviderToken, ProviderType } from "@adi/core";
import type { Type, ModuleWithProviders, Provider, EnvironmentProviders, ɵInternalEnvironmentProviders, ɵɵInjectorDef } from "@angular/core";

type AngularProvider = Provider | EnvironmentProviders | ɵInternalEnvironmentProviders;
type AngularProviders = Array<AngularProvider>;

export function importModules(modules: Type<any> | ModuleWithProviders<any> | Array<Type<any> | ModuleWithProviders<any>>): { providers: Array<ProviderType>, exportedTokens: Array<ProviderToken> } {
  modules = Array.isArray(modules) ? modules : [modules];
  const modulesSeen: Set<any> = new Set();
  const providers: Map<any, any> = new Map();
  modules.forEach(target => processNgModule(target, modulesSeen, providers));

  // convert providers
  const convertedProviders: Array<ProviderType> = [];
  const exportedTokens: Array<ProviderToken> = []
  // add core providers
  convertedProviders.push(...coreProviders());
  providers.forEach(provider => {
    // multi providers
    if (Array.isArray(provider)) {
      exportedTokens.push(provider[0].provide);
      return convertedProviders.push(...provider);
    }
    exportedTokens.push(provider.provide);
    convertedProviders.push(provider);
  });

  return { providers: convertedProviders, exportedTokens };
}

const injectorField = 'ɵinj';
function processNgModule(target: Type<any> | ModuleWithProviders<any>, modulesSeen: Set<any>, providers: Map<any, any>) {
  let moduleTarget: Type<any> = resolveForwardRef(target) as Type<any>;
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
    // traverse all imports
    injectableDef.imports.forEach(imported => {
      if (Array.isArray(imported)) {
        imported.forEach(imp => processNgModule(imp, modulesSeen, providers));
      } else {
        processNgModule(imported, modulesSeen, providers)
      }
    });

    // process all providers
    processProviders(injectableDef.providers, providers);
    // add module class as provider
    processProviders([
      { provide: moduleTarget, useClass: moduleTarget },
      { provide: ENVIRONMENT_INITIALIZER, useValue() { inject(moduleTarget) }, multi: true },
    ], providers);
  }
}
