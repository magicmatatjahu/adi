import { useMemo, useRef } from "react";
import { Injector } from "@adi/core";

import { createProvider } from "../context";
import { useInjectorContext, useCachedInjectorInput, useCachedInjectorOptions, useDestroyInjector } from "../hooks";
import { createInjector, destroyInjector } from "../utils";

import type { FunctionComponent, PropsWithChildren, ReactNode } from "react";
import type { InjectorOptions, InjectorInput } from "@adi/core";

export interface ModuleProps extends PropsWithChildren {
  input: InjectorInput | Injector;
  options?: InjectorOptions;
  fallback?: ReactNode;
}

export const Module: FunctionComponent<ModuleProps> = ({ input, options, children }) => {
  const ctx = useInjectorContext();
  const injectorRef = useRef<Injector | undefined>();

  const cachedInput = useCachedInjectorInput(input);
  const cachedOptions = useCachedInjectorOptions(options);

  const injector = useMemo(() => {
    const { injector: newInjector } = createInjector(cachedInput, cachedOptions, ctx?.injector);

    if (injectorRef.current !== undefined) {
      destroyInjector(injectorRef.current)
    }

    return injectorRef.current = newInjector as Injector
  }, [cachedInput, cachedOptions, injectorRef]);

  useDestroyInjector(injector)

  return createProvider(injector, children);
}
