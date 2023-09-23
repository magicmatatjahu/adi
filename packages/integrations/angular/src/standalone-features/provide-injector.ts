import { Injector } from '@adi/core';

import { injectorProviders } from './injector-providers';

import type { InjectorInput, InjectorOptions } from "@adi/core";
import type { StaticProvider } from '@angular/core';
import type { AdiModule } from '../tokens';

export function provideInjector(
  input?: InjectorInput | Injector,
  options?: InjectorOptions,
  ...provides: AdiModule[]
): StaticProvider[] {
  return injectorProviders(input, options, provides);
}
