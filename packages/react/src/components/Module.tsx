import { createElement, useContext, useEffect, useState } from "react";
import { Injector } from "@adi/core";

import { InjectorContext } from "../context";

import type { FunctionComponent, PropsWithChildren } from "react";
import type { InjectorOptions, ModuleMetadata, Provider, ClassType } from "@adi/core";

export interface ModuleProps {
  module: ClassType<any> | Omit<ModuleMetadata, | 'exports'> | Array<Provider> | Injector;
  options?: InjectorOptions;
  cacheID?: string | symbol;
}

export const Module: FunctionComponent<PropsWithChildren<ModuleProps>> = (props) => {
  const parentInjector = useContext(InjectorContext);
  const [injector] = useState<Injector>(() => {
    return createInjector(props, parentInjector || undefined) as Injector;
  });

  useEffect(() => {
    const cacheIdTypeof = typeof props.cacheID;
    if (cacheIdTypeof === 'string' || cacheIdTypeof === 'symbol') {
      return () => {
        setTimeout(() => {
          // use setTimeout to add destruction to the end of event loop
          injector.destroy();
        }, 0);
      }; 
    }
  }, []);

  return createElement(InjectorContext.Provider, { value: injector }, props.children);
}

const cache: Map<string | symbol, Injector> = new Map();
function createInjector(props: ModuleProps, parentInjector: Injector | undefined) {
  const cacheID = props.cacheID;
  if (cacheID !== undefined && cache.has(cacheID)) {
    return cache.get(cacheID);
  }

  const adiModule = props.module || [];
  let injector: Injector;
  if (adiModule instanceof Injector) {
    injector = adiModule;
  } else {
    const options = props.options || {};
    options.exporting = 'disabled';
    injector = Injector.create(adiModule, parentInjector, options).init() as Injector;
  }

  if (cacheID !== undefined) {
    cache.set(cacheID, injector as Injector);
  }
  return injector;
}
