import { InjectionToken } from '@angular/core';

import type { ModuleMetadata } from '@adi/core';

export type AdiModule = ModuleMetadata | { module: ModuleMetadata, order?: number };

export const ADI_MODULE = new InjectionToken<AdiModule>('adi.module');
