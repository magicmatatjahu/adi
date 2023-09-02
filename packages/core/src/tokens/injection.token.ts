import { ADI_INJECTABLE_DEF, ADI_INJECTION_ARGUMENT } from '../private';

import type { ObjectProvider, InjectionTokenOptions, ProviderToken, InjectionAnnotations, InjectionHook, InferredInjectFunctionResult } from "../types";

export class InjectionToken<T = unknown> {
  static argument<T>(token: ProviderToken<T>): InjectionToken<InferredInjectFunctionResult<T>>;
  static argument<T, A>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>): InjectionToken<A>;
  static argument<T, A, B>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>): InjectionToken<B>;
  static argument<T, A, B, C>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectionToken<C>;
  static argument<T, A, B, C, D>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectionToken<D>;
  static argument<T, A, B, C, D, E>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectionToken<E>;
  static argument<T, A, B, C, D, E, F>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectionToken<F>;
  static argument<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectionToken<G>;
  static argument<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectionToken<H>;
  static argument<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectionToken<unknown>;
  static argument<T>(token: ProviderToken<T>, ...hooks: InjectionHook[]): InjectionToken<unknown>;

  static argument<T>(token: ProviderToken<T>, annotations: InjectionAnnotations): InjectionToken<InferredInjectFunctionResult<T>>;
  static argument<T, A>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>): InjectionToken<A>;
  static argument<T, A, B>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>): InjectionToken<B>;
  static argument<T, A, B, C>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectionToken<C>;
  static argument<T, A, B, C, D>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectionToken<D>;
  static argument<T, A, B, C, D, E>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectionToken<E>;
  static argument<T, A, B, C, D, E, F>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectionToken<F>;
  static argument<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectionToken<G>;
  static argument<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectionToken<H>;
  static argument<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectionToken<unknown>;
  static argument<T>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: InjectionHook[]): InjectionToken<unknown>;

  static argument<A>(hook1: InjectionHook<unknown, A>): InjectionToken<A>
  static argument<A, B>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>): InjectionToken<B>;
  static argument<A, B, C>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectionToken<C>;
  static argument<A, B, C, D>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectionToken<D>;
  static argument<A, B, C, D, E>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectionToken<E>;
  static argument<A, B, C, D, E, F>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectionToken<F>;
  static argument<A, B, C, D, E, F, G>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectionToken<G>;
  static argument<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectionToken<H>;
  static argument<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectionToken<unknown>;
  static argument(...hooks: InjectionHook[]): InjectionToken<unknown>;

  static argument<T>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: InjectionHook[]): InjectionToken<T> {
    const newToken = new this();
    newToken[ADI_INJECTION_ARGUMENT] = { token, annotations, hooks }
    return newToken;
  }

  static create<T>(): InjectionToken<T> {
    return new this();
  }

  static provide<T>(provider: Omit<ObjectProvider<T>, 'provide'>): InjectionToken<T> {
    const token = new this();
    token[ADI_INJECTABLE_DEF] = {
      token: this,
      provide: {
        provide: token,
        ...provider
      },
    }
    return token;
  }

  constructor(
    options: InjectionTokenOptions<T> = {},
    public readonly name?: string,
  ) {
    // TODO: Fix circular references
    // if (options.inject) {
    //   this[ADI_INJECTION_ITEM] = parseInjectionItem(options.inject);
    // }
    
    this[ADI_INJECTABLE_DEF] = {
      token: this,
      options,
    };
  }
};
