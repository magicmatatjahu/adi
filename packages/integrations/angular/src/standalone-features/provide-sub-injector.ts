import { subInjectorProviders } from './sub-injector-providers';

import type { StaticProvider } from '@angular/core';

export function provideSubInjector(): StaticProvider[] {
  return subInjectorProviders();
}
