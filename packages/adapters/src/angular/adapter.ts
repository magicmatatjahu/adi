import { ModuleToken } from '@adi/core';
import { importModules } from './ng-module'; 

import type { ExtendedModule } from '@adi/core';
import type { Type, ModuleWithProviders } from "@angular/core";

export function angularAdapter(module: Type<any> | ModuleWithProviders<any>): ExtendedModule;
export function angularAdapter(modules: Array<Type<any> | ModuleWithProviders<any>>): ExtendedModule;
export function angularAdapter(modules: Type<any> | ModuleWithProviders<any> | Array<Type<any> | ModuleWithProviders<any>>): ExtendedModule {
  const { providers } = importModules(modules);

  return {
    extends: new ModuleToken(undefined, 'adi:module:angular'),
    providers,
    exports: providers,
  }
}
