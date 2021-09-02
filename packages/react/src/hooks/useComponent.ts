import { useEffect, useRef } from "react";

import { Token } from "@adi/core/lib/types";
import { Named } from "@adi/core";

import { useInjector } from "./useInjector";
import { COMPONENT_TOKEN } from "../constants";

// TODO: Add wrapper
export function useComponent<T>(component: Token<T>): T {
  const instance = useRef(null);
  const injector = useInjector();

  useEffect(() => {
    // TODO: make cleanup - probably components don't need the onDestroy hook
    return () => {
      console.log("cleaned up");
      instance.current = null;
    };
  }, []);

  if (injector === null) {
    throw new Error();
  }

  return instance.current || (instance.current = injector.get<T>(COMPONENT_TOKEN, Named(component)));
}
