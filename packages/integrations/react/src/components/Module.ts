import { useMemo, useRef, useState } from "react";
import { Injector, wait } from "@adi/core";

import { createProvider } from "../context";
import { useInjectorContext, useCachedInjectorInput, useCachedInjectorOptions, useDestroyInjector } from "../hooks";
import { createInjector, destroyInjector } from "../utils";

import type { FunctionComponent, PropsWithChildren, ReactNode } from "react";
import type { InjectorOptions, InjectorInput } from "@adi/core";

export interface ModuleProps extends PropsWithChildren {
  input?: InjectorInput | Injector;
  options?: InjectorOptions;
  fallback?: ReactNode;
  suspense?: string | symbol | object | boolean;
  cache?: string | symbol;
}

export const Module: FunctionComponent<ModuleProps> = ({ input = [], options, fallback, suspense, cache, children }) => {
  const ctx = useInjectorContext();
  const injectorRef = useRef<{ injector: Injector | Promise<any>, isAsync: boolean }>();

  const cachedInput = useCachedInjectorInput(input);
  const cachedOptions = useCachedInjectorOptions(options);

  const result = useMemo(() => {
    const isSuspense = Boolean(suspense) && fallback === undefined;
    const suspenseKey = typeof suspense === 'boolean' ? undefined : suspense;
    const result = createInjector(cachedInput, cachedOptions, ctx?.injector, cache, isSuspense, suspenseKey);

    const { current } = injectorRef;
    if (current !== undefined) {
      destroyInjector(current.injector)
    }

    return injectorRef.current = result;
  }, [cachedInput, cachedOptions, fallback, suspense, cache, injectorRef]);

  useDestroyInjector(result.injector)

  const [, hardRender] = useState(false);
  
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
