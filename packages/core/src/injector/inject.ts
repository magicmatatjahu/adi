import { destroy } from './lifecycle-manager';
import { inject as coreInject } from './resolver';
import { patchMethod, setInstanceContext } from './method-injection';
import { waitCallback, noopThen, noopCatch } from '../utils';

import type { Session } from './session';
import type { ProviderInstance } from './provider';
import type { ProviderToken, InjectionHook, InjectionAnnotations, InferredProviderTokenType, InjectFunctionResult, InjectionContext } from '../types';

export interface RunInContextArgument {
  inject: typeof inject,
}

export let CURRENT_INJECTION_CONTEXT: InjectionContext | undefined = undefined;
export function setCurrentInjectionContext(ctx: InjectionContext | undefined): InjectionContext | undefined {
  const previous = CURRENT_INJECTION_CONTEXT;
  CURRENT_INJECTION_CONTEXT = ctx;
  return previous;
}

export function inject<T>(token: ProviderToken<T>): InjectFunctionResult<InferredProviderTokenType<T>>;
export function inject<T, A>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>): InjectFunctionResult<A>;
export function inject<T, A, B>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
export function inject<T, A, B, C>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
export function inject<T, A, B, C, D>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
export function inject<T, A, B, C, D, E>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
export function inject<T, A, B, C, D, E, F>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
export function inject<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
export function inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
export function inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
export function inject<T>(token: ProviderToken<T>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;

export function inject<T>(token: ProviderToken<T>, annotations: InjectionAnnotations): InjectFunctionResult<InferredProviderTokenType<T>>;
export function inject<T, A>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>): InjectFunctionResult<A>;
export function inject<T, A, B>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
export function inject<T, A, B, C>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
export function inject<T, A, B, C, D>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
export function inject<T, A, B, C, D, E>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
export function inject<T, A, B, C, D, E, F>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
export function inject<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
export function inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
export function inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
export function inject<T>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;

export function inject(annotations: InjectionAnnotations): InjectFunctionResult<unknown>;
export function inject<A>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>): InjectFunctionResult<A>;
export function inject<A, B>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
export function inject<A, B, C>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
export function inject<A, B, C, D>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
export function inject<A, B, C, D, E>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
export function inject<A, B, C, D, E, F>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
export function inject<A, B, C, D, E, F, G>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
export function inject<A, B, C, D, E, F, G, H>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
export function inject<A, B, C, D, E, F, G, H>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
export function inject(annotations: InjectionAnnotations, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;

export function inject<A>(hook1: InjectionHook<unknown, A>): InjectFunctionResult<A>
export function inject<A, B>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
export function inject<A, B, C>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
export function inject<A, B, C, D>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
export function inject<A, B, C, D, E>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
export function inject<A, B, C, D, E, F>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
export function inject<A, B, C, D, E, F, G>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
export function inject<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
export function inject<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
export function inject(...hooks: InjectionHook[]): InjectFunctionResult<unknown>;

export function inject<T>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: InjectionHook[]): InjectFunctionResult<T> {
  if (CURRENT_INJECTION_CONTEXT === undefined) {
    throw new Error('inject() must be called from an injection context such as a constructor, a factory function or field initializer.');
  }

  return coreInject(CURRENT_INJECTION_CONTEXT, token as any, annotations as any, hooks)
}

export function runInInjectionContext<R>(fn: (arg: RunInContextArgument) => R, ctx: InjectionContext): R {
  function nearestInject<T>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: Array<InjectionHook>) {
    return coreInject(ctx, token as any, annotations as any, hooks)
  };

  const toDestroy = ctx.toDestroy = []
  const previosuContext = setCurrentInjectionContext(ctx);
  const arg: RunInContextArgument = { inject: nearestInject };
  return waitCallback(
    () => fn(arg),
    noopThen,
    noopCatch,
    () => exitFromInjectionContext(toDestroy, previosuContext),
  )
}

export function exitFromInjectionContext(instances: ProviderInstance[], previosuContext: InjectionContext | undefined) {
  destroy(instances);
  setCurrentInjectionContext(previosuContext)
}

export function injectMethod<T, F extends (...args: any) => any>(instance: T, method: F): F {
  if (CURRENT_INJECTION_CONTEXT === undefined) {
    throw new Error('injectMethod() must be called inside constructor!');
  }

  const { injector, session } = CURRENT_INJECTION_CONTEXT;
  const target = (instance as any).constructor;
  const methodName = method.name;
  setInstanceContext(instance, { injector, session: session as Session, injections: {} })
  return patchMethod(target, methodName);
}
