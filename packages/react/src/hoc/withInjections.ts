import { waitAll } from "@adi/core";
import { createElement, ReactNode, useContext, useState, useEffect } from "react";

import { useDestroy } from "../hooks/useDestroy";
import { InjectorContext } from "../context";
import { injectMap, convertMapInjections } from "../utils";

import type { InjectionItem } from "@adi/core";

export type WithInjectionsOptions = {
  fallback?: ReactNode;
}

export function withInjections<TProps, TInjectedKeys extends keyof TProps>(
  Component: React.JSXElementConstructor<TProps>,
  injections: Record<keyof Pick<TProps, TInjectedKeys>, InjectionItem>,
  options: WithInjectionsOptions = {},
) {
  const converted = convertMapInjections(injections);
  
  const ComponentWithInjection = (props: Omit<TProps, TInjectedKeys>) => {
    const ctx = useContext(InjectorContext);
    const [[results, instances, hasSideEffect, asyncOps], setState] = useState(() => {
      return injectMap(ctx.injector, converted);
    });

    useDestroy(instances, hasSideEffect);
    if (asyncOps) {
      waitAll(asyncOps, () => setState([results, instances, hasSideEffect, undefined]));
      const fallback = options?.fallback;
      return fallback ? fallback : null as any;
    }
  
    return createElement(Component, { ...(props as TProps), ...results });
  };

  return ComponentWithInjection;
}
