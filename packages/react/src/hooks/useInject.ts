import { useContext, useEffect, useRef } from "react";

import { Token } from "@adi/core/lib/types";
import { Wrapper } from "@adi/core";

import { InjectorContext } from "../context";

export function useInject<T>(token: Token<T>, wrapper?: Wrapper): T {
  const instance = useRef(null);
  const injector = useContext(InjectorContext);

  useEffect(() => {
    // TODO: make cleanup
    return () => {
      console.log("cleaned up");
      instance.current = null;
    };
  }, []);

  if (injector === null) {
    throw new Error();
  }

  return instance.current || (instance.current = injector.get<T>(token, wrapper));
}
