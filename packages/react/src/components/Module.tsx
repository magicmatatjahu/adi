import { useContext, useEffect, useRef } from "react";
import { Injector, InjectorOptions, ModuleMetadata, Provider, Type } from "@adi/core";
import { InjectorContext } from "../context";

export interface ModuleProps {
  module: Type<any> | ModuleMetadata | Array<Provider>;
  options?: InjectorOptions;
}

export const Module: React.FunctionComponent<ModuleProps> = (props) => {
  const injectorRef = useRef<Injector>(null);
  const parentInjector = useContext(InjectorContext);

  useEffect(() => {
    // TODO: make cleanup
    return () => {
      console.log("cleaned up");
      injectorRef.current = null;
    };
  }, []);

  const injector = 
    injectorRef.current ||
    (injectorRef.current = Injector.create(props.module, parentInjector || undefined, props.options));

  return (
    <InjectorContext.Provider value={injector}>
      {props.children}
    </InjectorContext.Provider>
  )
}
