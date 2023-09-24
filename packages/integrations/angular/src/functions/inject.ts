import { InjectionKind } from '@adi/core/lib/enums';
import { createInjectionMetadata, destroy } from '@adi/core/lib/injector';
import { inject as coreInject } from '@adi/core/lib/injector/resolver';
import { DestroyRef, inject as ngInject } from '@angular/core';

import { injectInjector } from './inject-injector';

import type { ProviderToken, InjectionAnnotations, InjectionHook, InferredProviderTokenType, InjectionContext, InjectionMetadata } from '@adi/core'

export function inject<T>(token: ProviderToken<T>): InferredProviderTokenType<T>;
export function inject<T, A>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>): A;
export function inject<T, A, B>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>): B;
export function inject<T, A, B, C>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): C;
export function inject<T, A, B, C, D>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): D;
export function inject<T, A, B, C, D, E>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): E;
export function inject<T, A, B, C, D, E, F>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): F;
export function inject<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): G;
export function inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): H;
export function inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): unknown;
export function inject<T>(token: ProviderToken<T>, ...hooks: InjectionHook[]): unknown;

export function inject<T>(token: ProviderToken<T>, annotations: InjectionAnnotations): InferredProviderTokenType<T>;
export function inject<T, A>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>): A;
export function inject<T, A, B>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>): B;
export function inject<T, A, B, C>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): C;
export function inject<T, A, B, C, D>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): D;
export function inject<T, A, B, C, D, E>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): E;
export function inject<T, A, B, C, D, E, F>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): F;
export function inject<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): G;
export function inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): H;
export function inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): unknown;
export function inject<T>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: InjectionHook[]): unknown;

export function inject(annotations: InjectionAnnotations): unknown;
export function inject<A>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>): A;
export function inject<A, B>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>): B;
export function inject<A, B, C>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): C;
export function inject<A, B, C, D>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): D;
export function inject<A, B, C, D, E>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): E;
export function inject<A, B, C, D, E, F>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): F;
export function inject<A, B, C, D, E, F, G>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): G;
export function inject<A, B, C, D, E, F, G, H>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): H;
export function inject<A, B, C, D, E, F, G, H>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): unknown;
export function inject(annotations: InjectionAnnotations, ...hooks: InjectionHook[]): unknown;

export function inject<A>(hook1: InjectionHook<unknown, A>): A
export function inject<A, B>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>): B;
export function inject<A, B, C>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): C;
export function inject<A, B, C, D>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): D;
export function inject<A, B, C, D, E>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): E;
export function inject<A, B, C, D, E, F>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): F;
export function inject<A, B, C, D, E, F, G>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): G;
export function inject<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): H;
export function inject<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): unknown;
export function inject(...hooks: InjectionHook[]): unknown;

export function inject<T>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: InjectionHook[]): T {
  const injector = injectInjector();
  const ctx: InjectionContext = {
    injector,
    session: undefined,
    current: undefined,
    metadata: createInjectionMetadata({
      kind: InjectionKind.CUSTOM,
    })
  }

  assignOnDestroyHook(ctx)
  return coreInject(ctx, token, annotations, hooks) as T;
}

function assignOnDestroyHook(ctx: InjectionContext) {
  const destroyRef = ngInject(DestroyRef, { self: true, optional: true });
  if (destroyRef === null) {
    return;
  }

  destroyRef.onDestroy(() => {
    const instance = ctx.current?.context?.instance
    instance && destroy(instance)
  });
}
