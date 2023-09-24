import { ADI_MODULE } from '../tokens';

import type { StaticProvider } from '@angular/core';
import type { AdiModule } from '../tokens';

export function provide(...modules: AdiModule[]): StaticProvider[] {
  return modules.map(m => ({
    provide: ADI_MODULE,
    multi: true,
    useValue: m,
  }))
}
