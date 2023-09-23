import { InjectionToken } from '@angular/core';

import type { Injector } from '@adi/core';

/**
 * @private
 */
export const ADI_INJECTOR = new InjectionToken<Injector | null>('adi.injector');
