import { computed, unref, watch, onScopeDispose } from 'vue-demi'
import { serializeInjectArguments as coreSerializeInjectArguments, destroy } from "@adi/core/lib/injector";

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
  const injectArg = computed(() => serializeInjectArguments(token, hooks, annotations));
  const result = computed(() => inject<T>(injector, injectArg.value));
  watch(result, ({ sideEffects, instance }) => sideEffects && Promise.resolve(destroy(instance)));
  onScopeDispose(() => {
    const { sideEffects, instance } = result.value;
    return sideEffects && Promise.resolve(destroy(instance));
  });
  return result.value.result;
}

function serializeInjectArguments<T>(token: MaybeRef<ProviderToken<T> | Array<InjectionHook> | InjectionHook>, hooks: MaybeRef<Array<InjectionHook> | InjectionAnnotations> = [], annotations: MaybeRef<InjectionAnnotations> = {}): ReturnType<typeof coreSerializeInjectArguments> {
  const plainToken = unref(token)
  const plainHook = unref(hooks)
  const plainAnnotations = unref(annotations)
  return coreSerializeInjectArguments(plainToken, plainHook, plainAnnotations);
}
