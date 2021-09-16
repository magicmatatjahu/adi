import { useEffect, useRef, createElement } from "react";
import { Injector, InjectorOptions, ModuleMetadata, ProtoInjector, Provider, Type } from "@adi/core";

import { useInjector } from "../hooks";
import { InjectorContext } from "../constants";
import { ComponentProvider } from "../interfaces";
import { createComponentProvider } from "../utils";

interface ModuleInline {
  module: Type<any> | Omit<ModuleMetadata, 'components' | 'exports'> | Array<Provider>;
  components?: Array<ComponentProvider>;
  options?: InjectorOptions;
}

interface ComponentsInline {
  components: Array<ComponentProvider>;
  module?: Type<any> | Omit<ModuleMetadata, 'components' | 'exports'> | Array<Provider>;
  options?: InjectorOptions;
}

// interface InjectorInline {
//   injector: ProtoInjector
// }

export type ModuleProps = 
 | ModuleInline
 | ComponentsInline
//  | InjectorInline;

export const Module: React.FunctionComponent<ModuleProps> = (props) => {
  const parentInjector = useInjector();
  const injectorRef = useRef<Injector>(null);
    // isInjectorInline(props) ? props.injector.fork(parentInjector || undefined) : null
  // );

  useEffect(() => {
    return () => {
      setTimeout(() => {
        // add to the end of event loop
        injectorRef.current.destroy();
      }, 0);
    };
  }, []);

  const injector = 
    injectorRef.current ||
    (injectorRef.current = createInjector(props as ModuleInline, parentInjector));

  return createElement(InjectorContext.Provider, { value: injector }, props.children);
}

function createInjector(props: ModuleInline | ComponentsInline, parentInjector: Injector): Injector {
  let _module = props.module || [];
  let options = props.options || {};
  options.disableExporting = false;

  if (props.components) {
    options.setupProviders = (options.setupProviders || []).concat(
      props.components.map(createComponentProvider)
    );
  }

  const injector = Injector.create(_module, parentInjector || undefined, options);
  if (Array.isArray(_module)) return injector;
  return injector.build();
}

// function isInjectorInline(props: ModuleProps): props is InjectorInline {
//   return (props as InjectorInline).injector !== undefined;
// }
