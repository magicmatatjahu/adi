import { useEffect, useRef } from "react";

import { DestroyManager, InstanceRecord, Wrapper,  } from "@adi/core";
import { Token } from "@adi/core/lib/types";

import { wrap } from "../utils";
import { useInjector } from "./useInjector";

export function useInject<T>(token: Token<T>, wrapper?: Wrapper): T {
  const injector = useInjector();
  const instanceRef = useRef<InstanceRecord>(null);
  const valueRef = useRef<T>(null);

  useEffect(() => {
    return () => {
      // change injector argument to undefined
      DestroyManager.destroy('default', instanceRef.current, injector);
      instanceRef.current = null;
      valueRef.current = null;
    };
  }, []);

  if (injector === null) {
    throw new Error();
  }

  if (instanceRef.current) return valueRef.current;
  const [v, r] = injector.get<[T, InstanceRecord<T>]>(token as any, wrap(wrapper));
  instanceRef.current = r;
  return (valueRef.current = v);
}
