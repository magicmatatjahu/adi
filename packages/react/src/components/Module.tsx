import { useEffect, useRef, createElement } from "react";
import { Injector } from "@adi/core";

import { useInjector } from "../hooks";
import { InjectorContext } from "../context";

import type { FunctionComponent, PropsWithChildren } from "react";
import type { InjectorOptions, ModuleMetadata, Provider, ClassType } from "@adi/core";

export interface ModuleProps {
  module: ClassType<any> | Omit<ModuleMetadata, | 'exports'> | Array<Provider>;
  options?: InjectorOptions;
  cacheID?: string | symbol;
}

export const Module: FunctionComponent<PropsWithChildren<ModuleProps>> = (props) => {
  const parentInjector = useInjector();
  const injectorRef = useRef<Injector>(null);

  useEffect(() => {
    if (!props.cacheID) {
      return () => {
        setTimeout(() => {
          // use setTimeout to add destruction to the end of event loop
          injectorRef.current.destroy();
        }, 0);
      }; 
    }
  }, []);

  const injector = 
    injectorRef.current ||
    (injectorRef.current = createInjector(props, parentInjector || undefined) as Injector);

  return createElement(InjectorContext.Provider, { value: injector }, props.children);
}

const cache: Map<string | symbol, Injector> = new Map();
function createInjector(props: ModuleProps, parentInjector: Injector | undefined) {
  const cacheID = props.cacheID;
  if (cacheID !== undefined && cache.has(cacheID)) {
    return cache.get(cacheID);
  }

  let adiModule = props.module || [];
  let options = props.options || {};

  const injector = Injector.create(adiModule, parentInjector, options).init();
  if (cacheID !== undefined) {
    cache.set(cacheID, injector as Injector);
  }
  return injector;
}
