import { createElement, useContext, useMemo } from "react";

import { useDestroy } from "../hooks/useDestroy";
import { InjectorContext } from "../context";
import { injectMap, convertMapInjections } from "../utils";

import type { InjectionItem } from "@adi/core";

export function withInjections<TProps, TInjectedKeys extends keyof TProps>(
  Component: React.JSXElementConstructor<TProps>,
  injections: Record<keyof Pick<TProps, TInjectedKeys>, InjectionItem>,
) {
  const converted = convertMapInjections(injections);
  
  const ComponentWithInjection = (props: Omit<TProps, TInjectedKeys>) => {
    const ctx = useContext(InjectorContext);
    const { instances, results, hasSideEffect } = useMemo(() => injectMap(ctx.injector, converted), []);
    useDestroy(instances, hasSideEffect);
  
    return createElement(Component, { ...(props as TProps), ...results });
  };

  return ComponentWithInjection;
}