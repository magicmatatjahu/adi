import { InjectionToken } from '@angular/core';

import type { Injector } from '@adi/core';

export type InternalInjectorType = {
  injector: Injector | null, 
  isAsync: boolean, 
  isResolved: boolean,
  isResolving: boolean,
  promise: Promise<void> | undefined
}

/**
 * @private
 */
export const ADI_INTERNAL_INJECTOR = new InjectionToken<InternalInjectorType>('adi.internal-injector');
