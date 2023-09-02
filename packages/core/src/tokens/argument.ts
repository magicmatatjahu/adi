import { InjectionToken } from './injection.token';

import type { ProviderToken, InferredInjectFunctionResult, InjectionAnnotations, InjectionHook } from '../types';

export function argument<T>(token: ProviderToken<T>): InjectionToken<InferredInjectFunctionResult<T>>;
export function argument<T, A>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>): InjectionToken<A>;
export function argument<T, A, B>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>): InjectionToken<B>;
export function argument<T, A, B, C>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectionToken<C>;
export function argument<T, A, B, C, D>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectionToken<D>;
export function argument<T, A, B, C, D, E>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectionToken<E>;
export function argument<T, A, B, C, D, E, F>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectionToken<F>;
export function argument<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectionToken<G>;
export function argument<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectionToken<H>;
export function argument<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectionToken<unknown>;
export function argument<T>(token: ProviderToken<T>, ...hooks: InjectionHook[]): InjectionToken<unknown>;

export function argument<T>(token: ProviderToken<T>, annotations: InjectionAnnotations): InjectionToken<InferredInjectFunctionResult<T>>;
export function argument<T, A>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>): InjectionToken<A>;
export function argument<T, A, B>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>): InjectionToken<B>;
export function argument<T, A, B, C>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectionToken<C>;
export function argument<T, A, B, C, D>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectionToken<D>;
export function argument<T, A, B, C, D, E>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectionToken<E>;
export function argument<T, A, B, C, D, E, F>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectionToken<F>;
export function argument<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectionToken<G>;
export function argument<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectionToken<H>;
export function argument<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectionToken<unknown>;
export function argument<T>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: InjectionHook[]): InjectionToken<unknown>;

export function argument<A>(hook1: InjectionHook<unknown, A>): InjectionToken<A>
export function argument<A, B>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>): InjectionToken<B>;
export function argument<A, B, C>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectionToken<C>;
export function argument<A, B, C, D>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectionToken<D>;
export function argument<A, B, C, D, E>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectionToken<E>;
export function argument<A, B, C, D, E, F>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectionToken<F>;
export function argument<A, B, C, D, E, F, G>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectionToken<G>;
export function argument<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectionToken<H>;
export function argument<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectionToken<unknown>;
export function argument(...hooks: InjectionHook[]): InjectionToken<unknown>;

export function argument<T>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: InjectionHook[]): InjectionToken<T> {
  return InjectionToken.argument(token as any, annotations as any, ...hooks);
}