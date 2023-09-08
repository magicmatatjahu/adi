import { useMemo, useRef, useState } from "react";
import { Injector, wait } from "@adi/core";

import { createProvider } from "../context";
import { useInjectorContext, useCachedInjectorInput, useCachedInjectorOptions, useDestroyInjector } from "../hooks";
import { createInjector, destroyInjector } from "../utils";

import type { FunctionComponent, PropsWithChildren, ReactNode } from "react";
import type { InjectorOptions, InjectorInput } from "@adi/core";

export interface ModuleProps extends PropsWithChildren {
  input: InjectorInput | Injector;
  options?: InjectorOptions;
  fallback?: ReactNode;
  suspense?: string | symbol | object | boolean;
}

export const Module: FunctionComponent<ModuleProps> = ({ input, options, fallback, suspense, children }) => {
  const ctx = useInjectorContext();
  const injectorRef = useRef<{ injector: Injector | Promise<any>, isAsync: boolean }>();

  const cachedInput = useCachedInjectorInput(input);
  const cachedOptions = useCachedInjectorOptions(options);

  const result = useMemo(() => {
    const isSuspense = Boolean(suspense) && fallback === undefined;
    const suspenseKey = typeof suspense === 'boolean' ? undefined : suspense;
    const result = createInjector(cachedInput, cachedOptions, ctx?.injector, isSuspense, suspenseKey);

    if (injectorRef.current !== undefined) {
      destroyInjector(injectorRef.current.injector)
    }

    return injectorRef.current = result
  }, [cachedInput, cachedOptions, fallback, suspense, injectorRef]);

  const [, hardRender] = useState(false);
  useDestroyInjector(result.injector)
  
  const injector = result.injector
  if (fallback !== undefined && result.isAsync) {
    wait(
      injector,
      syncInjector => {
        result.injector = syncInjector;
        result.isAsync = false;
        hardRender(prev => !prev);
      }
    )

    return fallback;
  }

  return createProvider(injector as Injector, children);
}
