import { Injector } from '@adi/core';
import { inject, Injector as AngularInjector } from '@angular/core';

import { ADI_INJECTOR, ADI_INTERNAL_INJECTOR, ANGULAR_INJECTOR } from '../tokens';

import type { StaticProvider } from '@angular/core'

export function subInjectorProviders(): StaticProvider[] {
  return [
    {
      provide: Injector,
      useFactory() {
        return inject(ADI_INTERNAL_INJECTOR).injector;
      }
    },
    {
      provide: ADI_INJECTOR,
      useExisting: Injector,
    },
    {
      provide: ADI_INTERNAL_INJECTOR,
      useFactory() {
        return {
          injector: null,
          isAsync: false,
          isResolved: false,
          isResolving: false,
          promise: undefined,
        };
      }
    },
    {
      provide: ANGULAR_INJECTOR,
      useFactory() {
        return inject(AngularInjector);
      }
    }
  ];
}
