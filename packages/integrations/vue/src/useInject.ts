import { computed, unref, watch, onScopeDispose } from 'vue-demi'
import { prepareInjectArgument as corePrepareInjectArgument, getInstanceFromCache, destroy } from "@adi/core/lib/injector";

import { useInjector } from './useInjector';
import { inject } from "./utils";

import type { ProviderToken, InjectionHook, InjectionAnnotations } from "@adi/core";
import type { MaybeRef } from './interfaces';

export function useInject<T = any>(token: MaybeRef<ProviderToken<T>>, annotations?: MaybeRef<InjectionAnnotations>): T;
export function useInject<T = any>(hook: MaybeRef<InjectionHook>, annotations?: MaybeRef<InjectionAnnotations>): T;
export function useInject<T = any>(hooks: MaybeRef<Array<InjectionHook>>, annotations?: MaybeRef<InjectionAnnotations>): T;
export function useInject<T = any>(token: MaybeRef<ProviderToken<T>>, hooks?: MaybeRef<Array<InjectionHook>>, annotations?: MaybeRef<InjectionAnnotations>): T;
export function useInject<T = any>(token: MaybeRef<ProviderToken<T> | Array<InjectionHook> | InjectionHook>, hooks?: MaybeRef<Array<InjectionHook> | InjectionAnnotations>, annotations?: MaybeRef<InjectionAnnotations>): T {
  const injector = useInjector();
  const injectArg = computed(() => prepareInjectArgument(token, hooks, annotations));
  const result = computed(() => {
    const cached = getInstanceFromCache(injector, token as ProviderToken<T>);
    if (cached !== undefined) {
      return { result: cached, instance: undefined, sideEffects: false }
    }
    return inject<T>(injector, injectArg.value);
  });
  watch(result, ({ sideEffects, instance }) => sideEffects && Promise.resolve(destroy(instance)));
  onScopeDispose(() => {
    const { sideEffects, instance } = result.value;
    return sideEffects && Promise.resolve(destroy(instance));
  });
  return result.value.result;
}

function prepareInjectArgument<T>(token: MaybeRef<ProviderToken<T> | Array<InjectionHook> | InjectionHook>, hooks: MaybeRef<Array<InjectionHook> | InjectionAnnotations> = [], annotations: MaybeRef<InjectionAnnotations> = {}): ReturnType<typeof corePrepareInjectArgument> {
  const plainToken = unref(token)
  const plainHook = unref(hooks)
  const plainAnnotations = unref(annotations)
  return corePrepareInjectArgument(plainToken as ProviderToken<T>, plainHook as Array<InjectionHook>, plainAnnotations);
}
