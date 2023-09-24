import { NgModule } from '@angular/core';

import { provideInjector, provide } from '../standalone-features';

import type { Injector, InjectorInput, InjectorOptions } from "@adi/core";
import type { ModuleWithProviders } from '@angular/core';
import type { AdiModule } from '../tokens';

@NgModule()
export class ADIModule {
  static provideInjector(
    input?: InjectorInput | Injector,
    options?: InjectorOptions,
    ...provides: AdiModule[]
  ): ModuleWithProviders<ADIModule> {
    return {
      ngModule: ADIModule,
      providers: provideInjector(input, options, ...provides)
    }
  }

  static provide(
    ...provides: AdiModule[]
  ): ModuleWithProviders<ADIModule> {
    return {
      ngModule: ADIModule,
      providers: provide(...provides)
    }
  }
}
