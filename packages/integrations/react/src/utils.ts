import { ADI, Injector } from "@adi/core";

import { hasScopedInjector } from "@adi/core/lib/injector";
import { destroy, destroyInjector as coreDestroyInjector } from "@adi/core/lib/injector/lifecycle-manager";
import { isModuleToken, isPromiseLike, wait } from "@adi/core/lib/utils";

import { SuspenseError } from './errors';

import type { ProviderInstance, InjectionContext, InjectorInput, InjectorOptions, Session, ProviderDefinition } from "@adi/core";

export type SuspensePromise<T = any> = Promise<T> & { status?: 'fulfilled' | 'rejected' | 'pending', error: any, value: T, instance?: ProviderInstance };

export function createInjector(input: InjectorInput | Injector, options: InjectorOptions | undefined, parentInjector?: Injector, cacheKey?: string | symbol, isSuspense?: boolean, suspenseKey?: string | symbol | object): { injector: Injector | Promise<Injector>, isAsync: boolean } {
  let isAsync: boolean = false;
  let injector: Injector | Promise<Injector> | undefined;
  const hasCacheKey = cacheKey !== undefined
  const parent = parentInjector || ADI.core;

  if (hasCacheKey && hasScopedInjector(parent, cacheKey)) {
    injector = parent.of(cacheKey);
  }

  const suspenseCache = getSuspenseCache(parent);
  const promise = suspenseCache.get(suspenseKey || input);

  if (promise) {
    return {
      injector: handleSuspense(promise as SuspensePromise, () => {
        suspenseCache.delete(suspenseKey || input)
      }),
      isAsync: false,
    }
  }

  if (input instanceof Injector) {
    injector = input.init();
  } else if (injector) {
    injector = (injector as Injector).init()
  } else if (hasCacheKey) {
    injector = parent.of(cacheKey, input as InjectorInput, { ...options || {}, exporting: false }).init();
  } else {
    injector = Injector.create(input as InjectorInput, { ...options || {}, exporting: false }, parent).init();
  }

  if (isPromiseLike(injector)) {
    isAsync = true;
  }

  if (isAsync && isSuspense) {
    // suspense can be only handled using some know reference like module class or module token
    const isProperInput = typeof input === 'function' || isModuleToken(input)
    if (!isProperInput) {
      throw new SuspenseError();
    }

    suspenseCache.set(suspenseKey || input, injector as SuspensePromise)
    return handleSuspense(injector as SuspensePromise)
  }
  
  return { injector, isAsync }
}

export function destroyInjector(injector: Injector | Promise<Injector> | undefined) {
  if (injector) {
    wait(injector, inj => coreDestroyInjector(inj))
  }
}

export function destroyInstances(instances: ProviderInstance[]) {
  if (instances.length) {
    destroy(instances)
  }
}

export function handleProviderSuspense(
  injector: Injector, 
  ctx: InjectionContext, 
  suspense: string | symbol | object | boolean | undefined, 
  currentPromise?: SuspensePromise, 
) {
  const cache = getSuspenseCache(injector)

  let promise: SuspensePromise
  let instance: ProviderInstance | undefined
  if (!currentPromise) {
    if (suspense === true) {
      return;
    }

    promise = cache.get(suspense as string | symbol | object) as SuspensePromise
    if (!promise) {
      return
    }
  } else {
    const result = getProviderSuspensePromise(ctx, suspense as string | symbol | object, currentPromise, cache);
    promise = result[0];
    instance = result[1];
  }

  function deleteFromCache() {
    // add at the end of event loop
    setTimeout(() => {
      [suspense, instance, instance?.definition].forEach(i => cache.delete(i as any));
    }, 0);
  }

  return handleSuspense(promise, deleteFromCache)
}

function noop() {}
function handleSuspense(promise: SuspensePromise, callback: () => void = noop) {
  switch (promise.status) {
    case 'fulfilled': return promise.value;
    case 'rejected': throw promise.error;
    case 'pending': throw promise;
    default: {
      promise.status = 'pending';
      promise.then(
        result => {
          promise.status = 'fulfilled';
          promise.value = result;
          callback()
        },
        error => {
          promise.status = 'rejected';
          promise.error = error;
          callback()
        },      
      );
      throw promise;
    }
  }
}

function getProviderSuspensePromise(
  ctx: InjectionContext,
  suspense: string | symbol | object | boolean | undefined, 
  currentPromise: SuspensePromise,
  cache: Map<string | symbol | object | ProviderDefinition | ProviderInstance, SuspensePromise | { instances: number }>,
): [ 
  SuspensePromise,
  ProviderInstance,
] {
  const session = ctx.current as Session;
  const instance = session.instance as ProviderInstance
  const definition = instance.definition;

  if (suspense !== undefined) {
    if (typeof suspense !== 'boolean') {
      const cachedPromise = cache.get(suspense);
      if (cachedPromise) {
        return [cachedPromise as SuspensePromise, instance];
      }

      cache.set(suspense, currentPromise);
    }

    cache.set(instance, currentPromise);
    return [currentPromise, instance];
  }

  const cachedPromise = cache.get(instance);
  if (cachedPromise) {
    return [cachedPromise as SuspensePromise, instance];
  }
  cache.set(instance, currentPromise);

  let definitionCtx = cache.get(definition) as { instances: number } | undefined;
  if (!definitionCtx) {
    cache.set(definition, (definitionCtx = { instances: 0 }));
  }

  const instances = definitionCtx.instances++;
  if (instances > 1) {
    throw new SuspenseError();
  }
  
  return [currentPromise, instance]
}

const suspenseSymbol = Symbol('adi:suspense-cache')
function getSuspenseCache(injector: Injector): Map<string | symbol | object | ProviderDefinition | ProviderInstance, SuspensePromise | { instances: number }> {
  let suspenseCache = injector.meta[suspenseSymbol];
  if (suspenseCache === undefined) {
    suspenseCache = injector.meta[suspenseSymbol] = new Map<string | symbol | object | ProviderDefinition | ProviderInstance, SuspensePromise | { instances: number }>();
  }
  return suspenseCache;
}
