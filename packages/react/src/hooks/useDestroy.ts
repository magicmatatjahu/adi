import { destroy } from '@adi/core/lib/injector';
import { useEffect } from 'react';

import type { ProviderInstance } from '@adi/core';

export function useDestroy(instance: ProviderInstance, hasSideEffect: boolean): void;
export function useDestroy(instances: Array<ProviderInstance>, hasSideEffect: boolean): void;
export function useDestroy(instances: ProviderInstance | Array<ProviderInstance>, hasSideEffect: boolean): void {
  useEffect(() => {
    if (hasSideEffect) {
      return () => {
        // use setTimeout to add destruction to the end of event loop
        setTimeout(() => {
          destroy(instances);
        }, 0);
      };
    }
  }, [instances]);
}
