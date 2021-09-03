import { useRef, useEffect, createElement } from "react";

import { InjectionItem } from "@adi/core";

import { useInjector } from "../hooks";
import { injectMap } from "../utils";

// TODO: Add providers and imports as third argument to make "functionality" like in Angular with @Component decorator and provider field in the option
export function withInjections<TProps, TInjectedKeys extends keyof TProps>(
  Component: React.JSXElementConstructor<TProps>,
  injections: Record<keyof Pick<TProps, TInjectedKeys>, InjectionItem>,
) {
  return (props: Omit<TProps, TInjectedKeys>) => {
    const instances = useRef(null);
    const injector = useInjector();
  
    useEffect(() => {
      // // TODO: make cleanup
      // return () => {
      //   console.log("cleaned withInjections");
      //   instances.current = null;
      // };
    }, []);
  
    if (injector === null) {
      throw new Error();
    }
  
    const injectedProps =
      instances.current ||
      (instances.current = injectMap(injector, injections));

    return createElement(Component, { ...(props as TProps), ...injectedProps });
  };
}
