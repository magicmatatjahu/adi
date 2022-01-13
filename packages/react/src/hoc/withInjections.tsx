import { useRef, useEffect, createElement } from "react";

import { ModuleMetadata, Provider, InjectionItem, InstanceRecord } from "@adi/core";
import { destroyAll } from "@adi/core/lib/injector";

import { Module } from "../components";

import { useInjector } from "../hooks";
import { injectMap } from "../utils";

export function withInjections<TProps, TInjectedKeys extends keyof TProps>(
  Component: React.JSXElementConstructor<TProps>,
  injections: Record<keyof Pick<TProps, TInjectedKeys>, InjectionItem>,
  module?: Omit<ModuleMetadata, 'components' | 'exports'> | Array<Provider>,
) {
  const ComponentWithInjection = (props: Omit<TProps, TInjectedKeys>) => {
    const injector = useInjector();
    const instancesRef = useRef<InstanceRecord[]>(null);
    const valuesRef = useRef<Record<string | symbol, any>>(null);
  
    useEffect(() => {
      return () => {
        setTimeout(() => {
          // use setTimeout to add destruction to the end of event loop
          destroyAll(instancesRef.current, 'default');
          instancesRef.current = null;
          valuesRef.current = null;
        }, 0);
      };
    }, []);

    if (injector === null) {
      throw new Error();
    }

    let values = valuesRef.current;
    if (values === null) {
      const result = injectMap(injector, injections);
      instancesRef.current = result.instances;
      values = valuesRef.current = result.values;
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
