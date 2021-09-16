import { useEffect, useRef } from "react";

import { DestroyManager, InjectionItem, InstanceRecord } from "@adi/core";

import { injectArray } from "../utils";
import { useInjector } from "./useInjector";

export function useInjections(...injections: Array<InjectionItem>): any[] {
  const injector = useInjector();
  const instancesRef = useRef<InstanceRecord[]>(null);
  const valuesRef = useRef<any[]>(null);

  useEffect(() => {
    return () => {
      // change injector argument to undefined
      DestroyManager.destroyAll('default', instancesRef.current, injector);
      instancesRef.current = null;
      valuesRef.current = null;
    };
  }, []);

  if (injector === null) {
    throw new Error();
  }

  if (instancesRef.current) return valuesRef.current;
  const result = injectArray(injector, injections);
  instancesRef.current = result.instances;
  return (valuesRef.current = result.values);
}
