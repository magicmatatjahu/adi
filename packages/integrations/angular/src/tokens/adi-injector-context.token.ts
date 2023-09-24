import { InjectionToken } from '@angular/core';

import type { InjectorInput } from '@adi/core';
import type { Injector as AngularInjector, DestroyRef } from '@angular/core';
import type { InternalInjectorType } from './adi-internal-injector.token';
import type { AdiModule } from './adi-module.token';

export type InjectorContextType = {
  parent: InternalInjectorType | undefined;
  internalInjector: InternalInjectorType;
  modules: AdiModule[];
  ngInjector: AngularInjector;
  destroyRef: DestroyRef;
  input: {
    input: InjectorInput | null,
  }
}

/**
 * @private
 */
export const ADI_INJECTOR_CONTEXT = new InjectionToken<InjectorContextType>('adi.injector-context');
