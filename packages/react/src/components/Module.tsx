import { useEffect, useRef, createElement } from "react";
import { Injector, InjectorOptions, ModuleMetadata, Provider, Type } from "@adi/core";

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

interface InjectorInline {
  injector: Injector;
}

export type ModuleProps = 
 | ModuleInline
 | ComponentsInline
 | InjectorInline;

export const Module: React.FunctionComponent<ModuleProps> = (props) => {
  const injectorRef = useRef<Injector>((props as InjectorInline).injector ? (props as InjectorInline).injector : null);
  const parentInjector = useInjector();

  useEffect(() => {
    return () => {
      injectorRef.current.destroy();
    };
  }, []);

  const injector = 
    injectorRef.current ||
    (injectorRef.current = createInjector(props as ModuleInline, parentInjector || undefined));

  return createElement(InjectorContext.Provider, { value: injector }, props.children);
}

function createInjector(props: ModuleInline | ComponentsInline, parentInjector: Injector): Injector {
  let _module = props.module || [];
  let options = props.options;

  if (props.components) {
    options = options || {};
    options.setupProviders = (options.setupProviders || []).concat(
      props.components.map(createComponentProvider)
    );
  }

  const injector = Injector.create(_module, parentInjector, options);
  if (Array.isArray(_module)) return injector;
  // TODO: change to synchronouse compilation
  return injector.compile() as unknown as Injector;
}
