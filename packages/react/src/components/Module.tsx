import { useEffect, useRef, createElement } from "react";
import { Injector, InjectorOptions, ModuleMetadata, Provider, Type } from "@adi/core";

import { useInjector } from "../hooks";
import { InjectorContext } from "../constants";

export interface ModuleProps {
  module: Type<any> | Omit<ModuleMetadata, 'components' | 'exports'> | Array<Provider>;
  options?: InjectorOptions;
  cacheID?: string | symbol;
}

export const Module: React.FunctionComponent<ModuleProps> = (props) => {
  const parentInjector = useInjector();
  const injectorRef = useRef<Injector>(null);

  useEffect(() => {
    if (props.cacheID === undefined) {
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
    (injectorRef.current = getInjector(props, parentInjector || undefined));

  return createElement(InjectorContext.Provider, { value: injector }, props.children);
}

const cache: Map<string | symbol, Injector> = new Map();
function getInjector(props: ModuleProps, parentInjector: Injector | undefined): Injector {
  const cacheID = props.cacheID;
  if (cacheID !== undefined && cache.has(cacheID)) {
    return cache.get(cacheID);
  }

  let adiModule = props.module || [];
  let options = props.options || {};
  options.disableExporting = false;

  const injector = Injector.create(adiModule, parentInjector, options);
  console.log(injector)
  if (cacheID !== undefined) {
    cache.set(cacheID, injector);
  }
  return injector.build();
}
