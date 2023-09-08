import { useMemo, useRef } from "react";

import { useInjectorContext, useCachedInjectorInput, useCachedInjectorOptions, useDestroyInjector } from "./helper-hooks";
import { createInjector, destroyInjector } from "../utils";

import type { Injector, InjectorInput, InjectorOptions } from "@adi/core";

export function useModule(
  input: InjectorInput | Injector,
  options?: InjectorOptions,
): Injector {
  const ctx = useInjectorContext();
  const injectorRef = useRef<Injector | undefined>();

  const cachedInput = useCachedInjectorInput(input);
  const cachedOptions = useCachedInjectorOptions(options);

  const injector = useMemo(() => {
    const { injector } = createInjector(cachedInput, cachedOptions, ctx?.injector);

    if (injectorRef.current !== undefined) {
      destroyInjector(injectorRef.current)
    }

    return injectorRef.current = injector as Injector
  }, [cachedInput, cachedOptions, injectorRef]);

  useDestroyInjector(injector)
  
  return injector;
}
