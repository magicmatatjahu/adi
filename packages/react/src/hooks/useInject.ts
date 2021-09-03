import { useEffect, useRef } from "react";

import { Token } from "@adi/core/lib/types";
import { Wrapper } from "@adi/core";

import { useInjector } from "./useInjector";

export function useInject<T>(token: Token<T>, wrapper?: Wrapper): T {
  const instance = useRef(null);
  const injector = useInjector();

  useEffect(() => {
    // // TODO: make cleanup
    // return () => {
    //   console.log("cleaned up useInject");
    //   instance.current = null;
    // };
  }, []);

  if (injector === null) {
    throw new Error();
  }

  return instance.current || (instance.current = injector.get<T>(token, wrapper));
}
