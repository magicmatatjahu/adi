import { waitAll } from "@adi/core";
import { createElement, ReactNode, useEffect, useState } from "react";

import { useDestroyInstances, useInjector } from "../hooks";
import { injectMap, convertMapInjections } from "../utils";

import type { InjectionItem } from "@adi/core";

export type WithInjectionsOptions = {
  displayName?: string
  fallback?: ReactNode;
}

export function withInjections<TProps, TInjectedKeys extends keyof TProps>(
  Component: React.JSXElementConstructor<TProps>,
  injections: Record<keyof Pick<TProps, TInjectedKeys>, InjectionItem>,
  options: WithInjectionsOptions = {},
) {
  const converted = convertMapInjections(injections);
  
  function ComponentWithInjection(props: Omit<TProps, TInjectedKeys>) {
    const injector = useInjector()
    const [{ instances, asyncOperations, toDestroy }, setState] = useState(() => {
      return injectMap(injector, converted);
    });

    useEffect(() => {
      if (asyncOperations.length) {
        waitAll(
          asyncOperations,
          result => setState(old => ({ ...old, asyncOperations: [] })),
        )
      }
    }, [setState, asyncOperations])

    useDestroyInstances(toDestroy);

    if (asyncOperations.length) {
      const fallback = options?.fallback;
      return fallback ? fallback : null as any;
    }
  
    return createElement(Component, { ...(props as TProps), ...instances });
  };

  ComponentWithInjection.displayName = options.displayName || 'ComponentWithInjection'
  return ComponentWithInjection;
}
