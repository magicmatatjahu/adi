import { Injector, wait } from '@adi/core';
import { ENVIRONMENT_INITIALIZER, inject, Injector as AngularInjector, DestroyRef } from '@angular/core';

import { createInjector } from './create-injector';
import { ADI_INJECTOR, ADI_INJECTOR_INITIALIZER, ANGULAR_INJECTOR } from '../tokens';

import type { InjectorInput, InjectorOptions } from "@adi/core";
import type { StaticProvider } from '@angular/core'
import type { AdiModule } from '../tokens';

export function injectorProviders(
  input?: InjectorInput | Injector,
  options?: InjectorOptions,
  provides: AdiModule[] = []
): StaticProvider[] {
  return [
    {
      provide: Injector,
      useFactory() {
        const parent = inject<Injector>(ADI_INJECTOR, { skipSelf: true, optional: true }) || undefined;
        const angularInjector = inject(AngularInjector);
        const destroyRef = inject(DestroyRef);

        return createInjector({ parent, angularInjector, destroyRef }, input, options, provides);
      }
    },
    {
      provide: ADI_INJECTOR,
      useExisting: Injector,
    },
    {
      provide: ADI_INJECTOR_INITIALIZER,
      useFactory() {
        return inject(Injector, { self: true });
      },
    },
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        inject(ADI_INJECTOR_INITIALIZER, { self: true });
      },
    },
    {
      provide: ANGULAR_INJECTOR,
      useFactory() {
        return inject(AngularInjector);
      }
    }
  ];
}
