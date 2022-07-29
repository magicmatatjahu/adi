import { createElement, useContext, useState } from "react";

import { Module } from "../components";
import { InjectorContext } from "../context";
import { injectMap, useDestroy } from "../utils";

import type { InjectorOptions, ModuleMetadata, Provider, InjectionItem, ProviderInstance } from "@adi/core";

export function withInjections<TProps, TInjectedKeys extends keyof TProps>(
  Component: React.JSXElementConstructor<TProps>,
  injections: Record<keyof Pick<TProps, TInjectedKeys>, InjectionItem>,
  module?: Omit<ModuleMetadata, 'exports'> | Array<Provider>,
  options?: InjectorOptions,
  cacheID?: string | symbol,
) {
  const ComponentWithInjection = (props: Omit<TProps, TInjectedKeys>) => {
    const injector = useContext(InjectorContext);
    const [instances] = useState<{ values: Record<string, any>; instances: Array<ProviderInstance> }>(() => {
      return injectMap(injector, injections)
    });
  
    useDestroy(instances.instances);
    return createElement(Component, { ...(props as TProps), ...instances.values });
  };

  // create component with Module wrapper
  if (module && typeof module === 'object') {
    const ComponentWithModule = (props: Omit<TProps, TInjectedKeys>) => {
      return (
        <Module module={module} options={options} cacheID={cacheID}>
          <ComponentWithInjection {...props} />
        </Module>
      );
    };
    return ComponentWithModule;
  }

  return ComponentWithInjection;
}