import { inject, Injector as NgInjector, DestroyRef } from '@angular/core';

import { ADI_INTERNAL_INJECTOR, ADI_MODULE, ADI_INJECTOR_INPUT } from "../tokens";

import type { AdiModule } from "../tokens";
import type { InjectorContextType } from "../tokens";

export function injectInjectorContext(): InjectorContextType {
  const parent = inject(ADI_INTERNAL_INJECTOR, { skipSelf: true, optional: true }) || undefined;
  const internalInjector = inject(ADI_INTERNAL_INJECTOR, { self: true });
  const ngInjector = inject(NgInjector);
  const destroyRef = inject(DestroyRef);
  const input = inject(ADI_INJECTOR_INPUT);
  const modules = inject<Array<AdiModule>>(ADI_MODULE, { self: true, optional: true }) || [];

  return {
    parent,
    internalInjector,
    modules,
    ngInjector,
    destroyRef,
    input,
  }
}
