import { destroy } from '@adi/core/lib/injector';
import { onScopeDispose } from 'vue-demi'

import type { ProviderInstance } from '@adi/core';

export function useDestroy(instance: ProviderInstance, hasSideEffect: boolean): void {
  if (hasSideEffect) {
    onScopeDispose(() => {
      destroy(instance);
    });
  }
}
