import { ADI_MODULE } from '../tokens';

import type { StaticProvider } from '@angular/core';
import type { AdiModule } from '../tokens';

export function providers(
  provides: AdiModule[] = []
): StaticProvider[] {
  return provides.map(provider => ({
    provide: ADI_MODULE,
    useValue: provider,
    multi: true,
  }))
}
