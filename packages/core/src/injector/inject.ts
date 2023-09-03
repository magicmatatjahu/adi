import { createInjectionMetadata } from './metadata';
import { destroy } from './lifecycle-manager';
import { inject as coreInject } from './resolver';
import { InjectionKind } from '../enums';
import { ResultHook } from '../hooks/private';
import { instancesToDestroyMetaKey } from '../private';
import { wait, waitCallback, noopThen, noopCatch } from '../utils';

import type { ProviderToken, InjectionHook, InjectionAnnotations, InferredInjectFunctionResult, InjectFunctionResult, InjectionContext, ProviderInstance } from '../types';

export interface RunInContextArgument {
  inject: typeof inject,
}

let currentContext: InjectionContext | undefined = undefined;
export function setCurrentInjectionContext(ctx: InjectionContext | undefined): InjectionContext | undefined {
  const previous = currentContext;
  currentContext = ctx;
  return previous;
}

function optimizedInject<T = any>(ctx: InjectionContext, token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: Array<InjectionHook>): T | Promise<T> {
  const instancesToDestroy = ctx[instancesToDestroyMetaKey];
  if (!instancesToDestroy) {
    return coreInject(ctx, token as any, annotations as any, ...hooks)
  }

  hooks.push(ResultHook())
  return wait(
    coreInject(ctx, token as any, annotations as any, ...hooks),
    ({ result, instance }) => {
      instancesToDestroy.push(instance)
      return result;
    }
  )
}

export function inject<T>(token: ProviderToken<T>): InjectFunctionResult<InferredInjectFunctionResult<T>>;
export function inject<T, A>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>): InjectFunctionResult<A>;
export function inject<T, A, B>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
export function inject<T, A, B, C>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
export function inject<T, A, B, C, D>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
export function inject<T, A, B, C, D, E>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
export function inject<T, A, B, C, D, E, F>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
export function inject<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
export function inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
export function inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
export function inject<T>(token: ProviderToken<T>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;

export function inject<T>(token: ProviderToken<T>, annotations: InjectionAnnotations): InjectFunctionResult<InferredInjectFunctionResult<T>>;
export function inject<T, A>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>): InjectFunctionResult<A>;
export function inject<T, A, B>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
export function inject<T, A, B, C>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
export function inject<T, A, B, C, D>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
export function inject<T, A, B, C, D, E>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
export function inject<T, A, B, C, D, E, F>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
export function inject<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
export function inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
export function inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
export function inject<T>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;

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
  if (currentContext === undefined) {
    throw new Error('inject() must be called from an injection context such as a constructor, a factory function or field initializer.');
  }
  return optimizedInject(currentContext, token, annotations, ...hooks);
}

export function injectMethod<T, F extends (...args: any) => any>(instance: T, method: F): F {
  if (currentContext === undefined) {
    throw new Error('injectMethod() must be called inside constructor!');
  }

  const { injector, session } = currentContext;
  const target = (instance as any).constructor;
  const descriptor = Object.getOwnPropertyDescriptor((target as any).prototype, method.name);
  const methodCtx: InjectionContext = { 
    injector,
    session,
    metadata: createInjectionMetadata({
      kind: InjectionKind.METHOD,
      target,
      descriptor,
    }),
  };

  return function(...args: any[]) {
    const toDestroy: any[] = [];
    const ctx: InjectionContext = { ...methodCtx, [instancesToDestroyMetaKey]: toDestroy }
    
    const previosuContext = setCurrentInjectionContext(ctx);
    return waitCallback(
      () => method.apply(instance, args),
      noopThen,
      noopCatch,
      () => finallyOperation(toDestroy, previosuContext),
    );
  } as F
}

export function runInInjectionContext<R>(fn: (arg: RunInContextArgument) => R, ctx: InjectionContext): R {
  function ctxInject<T>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: Array<InjectionHook>) {
    return optimizedInject(ctx, token, annotations, ...hooks);
  };

  const toDestroy = ctx[instancesToDestroyMetaKey] = ctx[instancesToDestroyMetaKey] || []
  const previosuContext = setCurrentInjectionContext(ctx);
  return waitCallback(
    () => fn({ inject: ctxInject }),
    noopThen,
    noopCatch,
    () => finallyOperation(toDestroy, previosuContext),
  )
}

function finallyOperation(instances: ProviderInstance[], previosuContext: InjectionContext | undefined) {
  destroy(instances);
  setCurrentInjectionContext(previosuContext)
}
