import { Injector } from '@adi/core';
import { ENVIRONMENT_INITIALIZER, inject } from '@angular/core';

import { createInjector } from './create-injector';
import { injectInjectorContext } from './inject-injector-context';
import { provide } from './provide';
import { ADI_INJECTOR, ADI_INJECTOR_INPUT, ADI_INJECTOR_INITIALIZER, ADI_INTERNAL_INJECTOR } from '../tokens';

import type { InjectorInput, InjectorOptions } from '@adi/core';
import type { StaticProvider } from '@angular/core';
import type { AdiModule } from '../tokens';

export function provideInjector(): StaticProvider[];
export function provideInjector(
  input?: InjectorInput | Injector,
  options?: InjectorOptions,
  ...modules: AdiModule[]
): StaticProvider[];
export function provideInjector(
  input?: InjectorInput | Injector,
  options?: InjectorOptions,
  ...modules: AdiModule[]
): StaticProvider[] {
  const providers: StaticProvider[] = [
    {
      provide: Injector,
      useFactory() {
        inject(ADI_INJECTOR_INITIALIZER, { self: true });
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
      provide: ADI_INJECTOR_INPUT,
      useFactory() {
        return {
          input: null,
        };
      }
    },
    {
      provide: ADI_INJECTOR_INITIALIZER,
      useFactory() {
        const ctx = injectInjectorContext();
        createInjector(ctx, input, options)
      },
    },
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        inject(ADI_INJECTOR_INITIALIZER, { self: true });
      },
    },
  ];

  if (modules && modules.length) {
    providers.push(
      ...provide(...modules)
    )
  }

  return providers;
}
