import { useEffect, useRef } from "react";
import { destroy, serializeInjectArguments } from "@adi/core/lib/injector";

import { useInjector } from './useInjector';
import { inject } from "../utils";

import type { ProviderToken, ProviderInstance, InjectionHook, InjectionAnnotations } from "@adi/core";

export function useInject<T = any>(token: ProviderToken<T>, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(token: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(token: ProviderToken<T>, hooks?: Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): T {
  const injector = useInjector(true);
  const instanceRef = useRef<{ value: any, instance: ProviderInstance }>(null);

  useEffect(() => {
    return () => {
      // use setTimeout to add destruction to the end of event loop
      setTimeout(() => {
        destroy(instanceRef.current.instance);
        instanceRef.current = null;
      }, 0);
    };
  }, []);

  if (instanceRef.current) return instanceRef.current.value;
  const injectArg = serializeInjectArguments(token as ProviderToken<T>, hooks as Array<InjectionHook>, annotations);
  instanceRef.current = inject(injector, injectArg);
  return instanceRef.current.value;
}
