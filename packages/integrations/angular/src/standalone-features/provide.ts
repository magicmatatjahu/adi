import { providers } from './providers';

import type { StaticProvider } from '@angular/core';
import type { AdiModule } from '../tokens';

export function provide(
  ...provides: AdiModule[]
): StaticProvider[] {
  return providers(provides);
}
