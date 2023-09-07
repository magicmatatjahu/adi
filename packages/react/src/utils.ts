import { Injector } from "@adi/core/";

import { createInjectionMetadata, destroy } from "@adi/core/lib/injector";
import { InjectionKind } from "@adi/core/lib/enums";
import { convertInjection, parseInjectArguments } from "@adi/core/lib/injector/metadata";
import { inject as coreInject, optimizedInject } from "@adi/core/lib/injector/resolver";
import { getAllKeys, isInjectionToken, isPromiseLike, wait } from "@adi/core/lib/utils";

import { DynamicInjectionError } from './errors';

import type { ProviderInstance, InjectionAnnotations, ProviderToken, InjectionHook, InjectionItem, InjectionArgument, InjectionContext, InjectorInput, InjectorOptions, Session, ProviderDefinition } from "@adi/core";

export const metadata = createInjectionMetadata({
  kind: InjectionKind.CUSTOM,
})

export function inject<T>(injector: Injector, token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, hooks?: InjectionHook[]): { instance: T, toDestroy: ProviderInstance[] } {
  const toDestroy: ProviderInstance[] = [];
  const ctx: InjectionContext = { 
    injector,
    session: undefined,
    current: undefined,
    metadata,
    toDestroy,
  }

  let instance: any
  const suspense = getInjectionAnnotations(token, annotations)?.suspense;
  if (suspense) {
    instance = handleSuspensePromise(injector, ctx, suspense);
  }

  if (instance === undefined) {
    instance = coreInject<T>(ctx, token, annotations, hooks);
    if (ctx.current?.hasFlag('async')) {
      instance = handleSuspensePromise(injector, ctx, suspense, instance as SuspensePromise);
    }
  }

  return {
    instance: instance as T,
    toDestroy
  }
}

export function injectMap(injector: Injector, injections: Record<string | symbol, InjectionArgument>) {
  const instances: Record<string | symbol, any> = {};
  const asyncOperations: Array<Promise<unknown>> = [];
  const toDestroy: ProviderInstance[] = []
  
  getAllKeys(injections).forEach(key => {
    const argument = injections[key];
    const injection = instances[key] = optimizedInject(injector, undefined, argument, { toDestroy });
    if (isPromiseLike(injection)) {
      asyncOperations.push(
        wait(
          injection,
          result => instances[key] = result
        ) as Promise<unknown>
      )
    }
  });

  return { instances, toDestroy, asyncOperations }
}

export function convertMapInjections(injections: Record<string | symbol, InjectionItem>): Record<string | symbol, InjectionArgument> {
  const converted: Record<string | symbol, InjectionArgument> = {}
  getAllKeys(injections).forEach(key => {
    converted[key] = convertInjection(injections[key], { ...metadata });
  });
  return converted;
}

export function createInjector(input: InjectorInput | Injector, options?: InjectorOptions, parentInjector?: Injector | undefined): { injector: Injector | Promise<Injector>, isAsync: boolean } {
  let isAsync: boolean = false;
  let injector: Injector | Promise<Injector> | undefined;
  
  if (input instanceof Injector) {
    injector = input.init();
  } else {
    injector = Injector.create(input as InjectorInput, { ...options, exporting: false }, parentInjector).init();
  }

  if (isPromiseLike(injector)) {
    isAsync = true;
  }
  
  return { injector, isAsync }
}

export function destroyInstances(instances: ProviderInstance[]) {
  Promise.resolve(destroy(instances));
}

export function destroyInjector(injector: Injector | Promise<Injector>) {
  Promise.resolve(wait(injector, injector => injector.destroy()));
}

function getInjectionAnnotations<T>(token: ProviderToken<T> | InjectionAnnotations, annotations?: InjectionAnnotations): InjectionAnnotations | undefined {
  if (typeof token === 'object' && !isInjectionToken(token)) {
    return token;
  }
  if (typeof annotations === 'object') {
    return annotations;
  }
}

type SuspensePromise<T = any> = Promise<T> & { status?: 'fulfilled' | 'rejected' | 'pending', error: any, value: T, instance?: ProviderInstance<T> };

const suspenseSymbol = Symbol('adi:suspense-cache')
function getSuspenseCache(injector: Injector): Map<string | symbol | object | ProviderDefinition | ProviderInstance, SuspensePromise | { instances: number }> {
  let suspenseCache = injector.meta[suspenseSymbol];
  if (suspenseCache === undefined) {
    suspenseCache = injector.meta[suspenseSymbol] = new Map<string | symbol | object | ProviderDefinition | ProviderInstance, SuspensePromise | { instances: number }>();
  }
  return suspenseCache;
}

function handleSuspensePromise(
  injector: Injector, 
  ctx: InjectionContext, 
  suspense: string | symbol | object | boolean | undefined, 
  currentPromise?: SuspensePromise, 
) {
  const cache = getSuspenseCache(injector)

  let promise: SuspensePromise
  let instance: ProviderInstance | undefined
  if (!currentPromise) {
    promise = cache.get(suspense as string | symbol | object) as SuspensePromise
    if (!promise) {
      return
    }
  } else {
    const result = getSuspensePromise(ctx, suspense as string | symbol | object, currentPromise, cache);
    promise = result[0];
    instance = result[1];
  }

  function deleteFromCache() {
    // add at the end of event loop
    setTimeout(() => {
      [suspense, instance, instance?.definition].forEach(i => cache.delete(i as any));
    }, 0);
  }

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
          deleteFromCache()
        },
        error => {
          promise.status = 'rejected';
          promise.error = error;
          deleteFromCache()
        },      
      );
      throw promise;
    }
  }
}

function getSuspensePromise(
  ctx: InjectionContext,
  suspense: string | symbol | object | undefined, 
  currentPromise: SuspensePromise,
  cache: Map<string | symbol | object | ProviderDefinition | ProviderInstance, SuspensePromise | { instances: number }>,
): [ 
  SuspensePromise,
  ProviderInstance,
] {
  const session = ctx.current as Session;
  const { instance, definition } = session.context as Required<Session['context']>;

  if (suspense !== undefined) {
    const cachedPromise = cache.get(suspense);
    if (cachedPromise) {
      return [cachedPromise as SuspensePromise, instance];
    }
      
    cache.set(suspense, currentPromise);
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
  if (instances > 10) {
    throw new DynamicInjectionError();
  }
  
  return [currentPromise, instance]
}
