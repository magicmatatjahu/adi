import { InjectionToken } from '@angular/core';

import type { InjectorInput } from '@adi/core';

export const ADI_INJECTOR_INPUT = new InjectionToken<{ input: InjectorInput | null }>('adi.injector-input');
