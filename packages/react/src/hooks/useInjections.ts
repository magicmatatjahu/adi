import { useContext, useEffect, useRef } from "react";

import { InjectionItem } from "@adi/core";

import { InjectorContext } from "../context";
import { injectArray } from "../utils";

export function useInjections<T>(...injections: Array<InjectionItem>): T {
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

  return (
    instances.current ||
    (instances.current = injectArray(injector, injections))
  );
}
