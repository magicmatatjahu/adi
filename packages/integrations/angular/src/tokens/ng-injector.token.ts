import { InjectionToken } from '@adi/core';

import type { Injector } from '@angular/core';

/**
 * @private
 */
export const NG_INJECTOR = InjectionToken.create<Injector>({ name: 'ng:injector' });
