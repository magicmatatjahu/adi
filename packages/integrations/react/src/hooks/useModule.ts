import { useMemo, useRef } from "react";

import { useInjectorContext, useCachedInjectorInput, useCachedInjectorOptions, useDestroyInjector } from "./helper-hooks";
import { createInjector, destroyInjector } from "../utils";

import type { Injector, InjectorInput, InjectorOptions } from "@adi/core";

export function useModule(
  input: InjectorInput | Injector = [],
  options?: InjectorOptions & {
    suspense?: string | symbol | object | boolean;
    cache?: string | symbol;
  }
): Injector {
  const ctx = useInjectorContext();
  const injectorRef = useRef<Injector | undefined>();

  const cachedInput = useCachedInjectorInput(input);
  const cachedOptions = useCachedInjectorOptions(options) as InjectorOptions & {
    suspense?: string | symbol | object | boolean;
    cache?: string | symbol;
  }

  const injector = useMemo(() => {
    const { suspense, cache } = cachedOptions || {}
    const isSuspense = Boolean(suspense)
    const suspenseKey = typeof suspense === 'boolean' ? undefined : suspense;

    const { injector } = createInjector(cachedInput, cachedOptions, ctx?.injector, cache, isSuspense, suspenseKey);

    if (injectorRef.current !== undefined) {
      destroyInjector(injectorRef.current)
    }

    return injectorRef.current = injector as Injector
  }, [cachedInput, cachedOptions, injectorRef]);

  useDestroyInjector(injector)
  
  return injector;
}
