import { useRef, useContext, useEffect, createElement } from "react";

import { InjectionItem } from "@adi/core";

import { InjectorContext } from "../context";
import { injectMap } from "../utils";

export function withInjections<TProps, TInjectedKeys extends keyof TProps>(
  Component: React.JSXElementConstructor<TProps>,
  injections: Record<keyof Pick<TProps, TInjectedKeys>, InjectionItem>,
) {
  const instances = useRef(null);
  const injector = useContext(InjectorContext);

  useEffect(() => {
    // TODO: make cleanup
    return () => {
      console.log("cleaned up");
      instances.current = null;
    };
  }, []);

  if (injector === null) {
    throw new Error();
  }

  const injectedProps =
    instances.current ||
    (instances.current = injectMap(injector, injections));

  return (props: Omit<TProps, TInjectedKeys>) => {
    return createElement(Component, { ...(props as TProps), ...injectedProps });
  };
}
