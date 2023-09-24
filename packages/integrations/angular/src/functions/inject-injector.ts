import { inject } from '@angular/core';

import { ADI_INTERNAL_INJECTOR } from '../tokens';

export function injectInjector() {
  const { isResolved, injector } = inject(ADI_INTERNAL_INJECTOR);

  if (isResolved === false) {
    throw new Error('isResolved = false')
  }

  if (injector === null) {
    throw new Error('injector = null')
  }

  return injector;
}
