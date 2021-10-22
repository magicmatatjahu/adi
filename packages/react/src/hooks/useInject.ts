import { useEffect, useRef } from "react";

import { DestroyManager, InstanceRecord, Wrapper,  } from "@adi/core";
import { Token } from "@adi/core/lib/types";

import { wrap } from "../utils";
import { useInjector } from "./useInjector";

export function useInject<T>(token: Token<T>, ...wrappers: Wrapper[]): T {
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
  const [value, instance] = injector.get<[T, InstanceRecord<T>]>(token as any, wrap(wrappers));
  instanceRef.current = instance;
  return (valueRef.current = value);
}
