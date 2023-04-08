import { computed, unref, onScopeDispose, ref, watch } from 'vue-demi'

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
  }, [instances, hasSideEffect]);
}
