import { useMemo } from "react";
import { prepareInjectArgument, getInstanceFromCache } from "@adi/core/lib/injector";

import { useInjector } from './useInjector';
import { inject, useDestroy } from "../utils";

import type { ProviderToken, InjectionHook, InjectionAnnotations } from "@adi/core";

export function useInject<T = any>(token?: ProviderToken<T>): T;
export function useInject<T = any>(hook?: InjectionHook): T;
export function useInject<T = any>(hooks?: Array<InjectionHook>): T;
export function useInject<T = any>(token?: ProviderToken<T>, hook?: InjectionHook): T;
export function useInject<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>): T;
export function useInject<T = any>(token?: ProviderToken<T>, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(hook?: InjectionHook, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(token?: ProviderToken<T>, hook?: InjectionHook, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook>, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): T {
  const injector = useInjector();
  const { result, instance, sideEffects } = useMemo(() => {
    const cached = getInstanceFromCache(injector, token as ProviderToken<T>);
    if (cached !== undefined) {
      return { result: cached, instance: undefined, sideEffects: false }
    }
    const argument = prepareInjectArgument(token as ProviderToken<T>, hooks as Array<InjectionHook>, annotations);
    return inject(injector, argument, argument.metadata.annotations);
  }, [injector, token, hooks, annotations]);
  useDestroy(instance, sideEffects);
  return result;
}
