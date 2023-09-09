import { useMemo, useRef } from "react";

import { createInjectionMetadata } from "@adi/core/lib/injector";
import { inject as coreInject } from "@adi/core/lib/injector/resolver";
import { isInjectionToken } from "@adi/core/lib/utils";
import { InjectionKind } from "@adi/core/lib/enums";

import { SuspenseError } from '../errors';
import { useDestroyInstances, useCachedAnnotations, useCachedHooks } from './helper-hooks';
import { useInjector } from './useInjector';
import { destroyInstances, handleProviderSuspense } from '../utils';

import type { Injector, ProviderToken, InjectionHook, InjectionAnnotations, InjectionContext, InferredProviderTokenType, ProviderInstance } from "@adi/core";
import type { SuspensePromise } from '../utils';

const metadata = createInjectionMetadata({
  kind: InjectionKind.CUSTOM,
})

export function useInject<T>(token: ProviderToken<T>): InferredProviderTokenType<T>;
export function useInject<T, A>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>): A;
export function useInject<T, A, B>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>): B;
export function useInject<T, A, B, C>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): C;
export function useInject<T, A, B, C, D>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): D;
export function useInject<T, A, B, C, D, E>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): E;
export function useInject<T, A, B, C, D, E, F>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): F;
export function useInject<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): G;
export function useInject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): H;
export function useInject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): unknown;
export function useInject<T>(token: ProviderToken<T>, ...hooks: InjectionHook[]): unknown;

export function useInject<T>(token: ProviderToken<T>, annotations: InjectionAnnotations): InferredProviderTokenType<T>;
export function useInject<T, A>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>): A;
export function useInject<T, A, B>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>): B;
export function useInject<T, A, B, C>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): C;
export function useInject<T, A, B, C, D>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): D;
export function useInject<T, A, B, C, D, E>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): E;
export function useInject<T, A, B, C, D, E, F>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): F;
export function useInject<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): G;
export function useInject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): H;
export function useInject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): unknown;
export function useInject<T>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: InjectionHook[]): unknown;

export function useInject(annotations: InjectionAnnotations): unknown;
export function useInject<A>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>): A;
export function useInject<A, B>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>): B;
export function useInject<A, B, C>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): C;
export function useInject<A, B, C, D>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): D;
export function useInject<A, B, C, D, E>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): E;
export function useInject<A, B, C, D, E, F>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): F;
export function useInject<A, B, C, D, E, F, G>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): G;
export function useInject<A, B, C, D, E, F, G, H>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): H;
export function useInject<A, B, C, D, E, F, G, H>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): unknown;
export function useInject(annotations: InjectionAnnotations, ...hooks: InjectionHook[]): unknown;

export function useInject<A>(hook1: InjectionHook<unknown, A>): A
export function useInject<A, B>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>): B;
export function useInject<A, B, C>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): C;
export function useInject<A, B, C, D>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): D;
export function useInject<A, B, C, D, E>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): E;
export function useInject<A, B, C, D, E, F>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): F;
export function useInject<A, B, C, D, E, F, G>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): G;
export function useInject<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): H;
export function useInject<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): unknown;
export function useInject(...hooks: InjectionHook[]): unknown;

export function useInject<T>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: InjectionHook[]): T {
  const injector = useInjector();
  const instanceRef = useRef<{ instance: T, toDestroy: ProviderInstance[] }>();

  const cachedAnnotations = useCachedAnnotations(annotations);
  const cachedHooks = useCachedHooks(hooks);

  const { instance, toDestroy } = useMemo(() => {
    const result = inject(injector, token, cachedAnnotations, cachedHooks);

    const current = instanceRef.current
    if (current !== undefined && current.toDestroy[0] !== result.toDestroy[0]) {
      destroyInstances(current.toDestroy)
    }

    return instanceRef.current = result
  }, [injector, token, cachedAnnotations, cachedHooks, instanceRef]);

  useDestroyInstances(toDestroy);

  return instance;
}

export function inject<T>(injector: Injector, token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, hooks?: InjectionHook[]): { instance: T, toDestroy: ProviderInstance[] } {
  const toDestroy: ProviderInstance[] = [];
  const ctx: InjectionContext = { 
    injector,
    session: undefined,
    current: undefined,
    metadata: { ...metadata },
    toDestroy,
  }

  let instance: any
  const suspense = getInjectionAnnotations(token, annotations)?.suspense;
  if (suspense) {
    instance = handleProviderSuspense(injector, ctx, suspense);
  }

  if (instance === undefined) {
    instance = coreInject<T>(ctx, token, annotations, hooks);
    if (ctx.current?.hasFlag('async')) {
      if (suspense) {
        instance = handleProviderSuspense(injector, ctx, suspense, instance as SuspensePromise);
      } else {
        throw new SuspenseError()
      }
    }
  }

  return {
    instance: instance as T,
    toDestroy
  }
}

function getInjectionAnnotations<T>(token: ProviderToken<T> | InjectionAnnotations, annotations?: InjectionAnnotations): InjectionAnnotations | undefined {
  if (typeof token === 'object' && !isInjectionToken(token)) {
    return token;
  }
  if (typeof annotations === 'object') {
    return annotations;
  }
}
