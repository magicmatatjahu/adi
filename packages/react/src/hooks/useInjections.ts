import { useEffect, useRef } from "react";

import { InjectionItem } from "@adi/core";

import { injectArray } from "../utils";
import { useInjector } from "./useInjector";

export function useInjections<T>(...injections: Array<InjectionItem>): T {
  const instances = useRef(null);
  const injector = useInjector();

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

  return (
    instances.current ||
    (instances.current = injectArray(injector, injections))
  );
}
