import { useRef, useEffect, createElement } from "react";
import { destroyCollection } from "@adi/core/lib/injector";

import { Module } from "../components";
import { useInjector } from "../hooks";
import { injectMap } from "../utils";

import type { ModuleMetadata, Provider, InjectionItem, ProviderInstance } from "@adi/core";

export function withInjections<TProps, TInjectedKeys extends keyof TProps>(
  Component: React.JSXElementConstructor<TProps>,
  injections: Record<keyof Pick<TProps, TInjectedKeys>, InjectionItem>,
  module?: Omit<ModuleMetadata, 'exports'> | Array<Provider>,
) {
  const ComponentWithInjection = (props: Omit<TProps, TInjectedKeys>) => {
    const injector = useInjector(true);
    const instancesRef = useRef<{ values: Record<string, any>; instances: Array<ProviderInstance> }>(null);
  
    useEffect(() => {
      return () => {
        // use setTimeout to add destruction to the end of event loop
        setTimeout(() => {
          destroyCollection(instancesRef.current.instances);
          instancesRef.current = null;
        }, 0);
      };
    }, []);

    let values: Record<string, any> = instancesRef.current?.values;
    if (!values) {
      values = (instancesRef.current = injectMap(injector, injections)).values;
    }

    return createElement(Component, { ...(props as TProps), ...values });
  };

  // create component with Module wrapper
  if (module && typeof module === 'object') {
    const ComponentWithModule = (props: Omit<TProps, TInjectedKeys>) => {
      return (
        <Module module={module}>
          <ComponentWithInjection {...props} />
        </Module>
      );
    };
    return ComponentWithModule;
  }

  return ComponentWithInjection;
}