import { parseInjectArguments } from './metadata';
import { destroy } from './lifecycle-manager';
import { inject as coreInject, getInstanceFromCache } from './resolver';
import { InjectionKind } from '../enums';
import { InstanceHook } from '../hooks';
import { instancesToDestroyMetaKey } from '../private';
import { wait, waitCallback, noopThen, noopCatch } from '../utils';

import type { Injector } from './injector';
import type { Session } from './session';
import type { ProviderToken, InjectionHook, InjectionAnnotations, InjectionMetadata, InjectionHookResult } from '../types';

export interface CurrentInjectionContext {
  injector: Injector;
  session?: Session;
  metadata?: InjectionMetadata;
}

export interface RunInContextArgument {
  inject: typeof inject,
}

let currentContext: CurrentInjectionContext | undefined = undefined;
export function setCurrentInjectionContext(ctx: CurrentInjectionContext | undefined): CurrentInjectionContext | undefined {
  const previous = currentContext;
  currentContext = ctx;
  return previous;
}

function baseInject<T>(ctx: CurrentInjectionContext, token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): T | Promise<T> {
  const { injector, session, metadata = {} } = ctx;

  // only one argument
  if (hooks === undefined) {
    const cached = getInstanceFromCache(injector, token as ProviderToken);
    if (cached !== undefined) {
      return cached;
    }
  }
  
  const argument = parseInjectArguments(token as ProviderToken<T>, annotations, hooks as Array<InjectionHook>);
  argument.metadata = { ...argument.metadata, ...metadata, annotations };

  const instancesToDestroy = currentContext[instancesToDestroyMetaKey];
  if (instancesToDestroy === undefined) {
    return coreInject(injector, argument, session) as T;
  }

  argument.hooks = [InstanceHook, ...argument.hooks];
  return wait(
    coreInject(injector, argument, session),
    ({ result, instance }: InjectionHookResult<typeof InstanceHook>) => {
      instancesToDestroy.push(instance)
      return result;
    }
  ) as T;
}

export function inject<T = any>(token: ProviderToken<T>): ParameterDecorator | PropertyDecorator;
export function inject<T = any>(annotations: InjectionAnnotations): ParameterDecorator | PropertyDecorator;
export function inject<T = any>(...hooks: Array<InjectionHook>): ParameterDecorator | PropertyDecorator;
export function inject<T = any>(token: ProviderToken<T>, annotations: InjectionAnnotations): ParameterDecorator | PropertyDecorator;
export function inject<T = any>(token: ProviderToken<T>, ...hooks: Array<InjectionHook>): ParameterDecorator | PropertyDecorator;
export function inject<T = any>(annotations: InjectionAnnotations, ...hooks: Array<InjectionHook>): ParameterDecorator | PropertyDecorator;
export function inject<T = any>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: Array<InjectionHook>): ParameterDecorator | PropertyDecorator;
export function inject<T = any>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: Array<InjectionHook>): T | Promise<T> {
  if (currentContext === undefined) {
    throw new Error('inject() must be called from an injection context such as a constructor, a factory function or field initializer.');
  }
  return baseInject(currentContext, token, annotations, hooks) as T;
}

export function injectMethod<T, F extends (...args: any) => any>(instance: T, method: F): F {
  if (currentContext === undefined) {
    throw new Error('injectMethod() must be called inside constructor!');
  }

  const { injector, session } = currentContext;
  const target = (instance as any).constructor;
  const descriptor = Object.getOwnPropertyDescriptor((target as any).prototype, method.name);
  const methodCtx = { 
    injector,
    session,
    metadata: {
      kind: InjectionKind.METHOD,
      target,
      descriptor,
    }
  };

  return function(...args: any[]) {
    const ctxInstances: any[] = [];
    const ctx = { ...methodCtx, [instancesToDestroyMetaKey]: ctxInstances }
    const previosuContext = setCurrentInjectionContext(ctx);
    try {
      return waitCallback(
        () => method.apply(instance, args),
        noopThen,
        noopCatch,
        () => destroy(ctxInstances),
      )
    } finally {
      setCurrentInjectionContext(previosuContext)
    }
  } as F
}

export function runInInjectionContext<R>(fn: (arg: RunInContextArgument) => R, ctx: CurrentInjectionContext): R {
  function ctxInject<T>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations) {
    return baseInject(ctx, token, hooks, annotations);
  };

  const previosuContext = setCurrentInjectionContext(ctx);
  try {
    return fn({ inject: ctxInject });
  } finally {
    setCurrentInjectionContext(previosuContext);
  }
}
