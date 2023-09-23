import { InjectionToken } from '@adi/core';

import type { Injector } from '@angular/core';

/**
 * @private
 */
export const ANGULAR_INJECTOR = InjectionToken.create<Injector>({ name: 'angular:injector' });
