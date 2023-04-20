import { useMemo } from "react";
import { serializeInjectArguments } from "@adi/core/lib/injector";

import { useInjector } from './useInjector';
import { inject, useDestroy } from "../utils";

import type { ProviderToken, InjectionHook, InjectionAnnotations } from "@adi/core";

export function useInject<T = any>(token: ProviderToken<T>, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(hook: InjectionHook, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(hooks: Array<InjectionHook>, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(token: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(token: ProviderToken<T> | Array<InjectionHook> | InjectionHook, hooks?: Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): T {
  const injector = useInjector();
  const { result, instance, sideEffects } = useMemo(() => {
    const injectArg = serializeInjectArguments(token, hooks, annotations);
    return inject(injector, injectArg);
  }, [token, hooks, annotations]);
  
  useDestroy(instance, sideEffects);
  return result;
}
