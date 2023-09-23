import { InjectionToken } from '@angular/core';

import type { ProviderType } from '@adi/core';

export type AdiProviders = Array<ProviderType> | { providers: Array<ProviderType>, order?: number };

export const ADI_PROVIDERS = new InjectionToken<AdiProviders>('adi.providers');
