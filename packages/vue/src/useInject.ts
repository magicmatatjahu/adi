import { serializeInjectArguments } from "@adi/core/lib/injector";

import { useInjector } from './useInjector';
import { useDestroy } from "./useDestroy";
import { inject } from "./utils";

import type { ProviderToken, InjectionHook, InjectionAnnotations } from "@adi/core";

export function useInject<T = any>(token: ProviderToken<T>, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(token: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(token: ProviderToken<T>, hooks?: Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): T {
  const injector = useInjector();
  const injectArg = serializeInjectArguments(token as ProviderToken<T>, hooks as Array<InjectionHook>, annotations);
  const { result, instance, sideEffects } = inject<T>(injector, injectArg);
  useDestroy(instance, sideEffects);
  return result;
}
