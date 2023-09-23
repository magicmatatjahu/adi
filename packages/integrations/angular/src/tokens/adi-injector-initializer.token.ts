import { InjectionToken } from '@angular/core';

/**
 * @private
 */
export const ADI_INJECTOR_INITIALIZER = new InjectionToken<() => void>('adi.injector-initializer');
