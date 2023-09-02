import { createInjectionMetadata } from './metadata';
import { destroy } from './lifecycle-manager';
import { inject as coreInject } from './resolver';
import { InjectionKind } from '../enums';
import { ResultHook } from '../hooks/private';
import { instancesToDestroyMetaKey } from '../private';
import { wait, waitCallback, noopThen, noopCatch } from '../utils';

import type { ProviderToken, InjectionHook, InjectionAnnotations, InjectionHookResult, InjectionContext, ProviderInstance } from '../types';

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

export function inject<T = any>(token: ProviderToken<T>): T | Promise<T>;
export function inject<T = any>(annotations: InjectionAnnotations): T | Promise<T>;
export function inject<T = any>(...hooks: Array<InjectionHook>): T | Promise<T>;
export function inject<T = any>(token: ProviderToken<T>, annotations: InjectionAnnotations): T | Promise<T>;
export function inject<T = any>(token: ProviderToken<T>, ...hooks: Array<InjectionHook>): T | Promise<T>;
export function inject<T = any>(annotations: InjectionAnnotations, ...hooks: Array<InjectionHook>): T | Promise<T>;
export function inject<T = any>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: Array<InjectionHook>): T | Promise<T>;
export function inject<T = any>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: Array<InjectionHook>): T | Promise<T> {
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
