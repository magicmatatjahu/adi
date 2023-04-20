import { useEffect } from 'react';
import { destroy } from "@adi/core/lib/injector";
import { InjectionKind } from "@adi/core/lib/enums";
import { createInjectionArgument, convertInjection } from "@adi/core/lib/injector";
import { inject as coreInject } from "@adi/core/lib/injector/resolver";
import { InstanceHook } from "@adi/core/lib/hooks/internal";
import { getAllKeys, isPromiseLike, wait } from "@adi/core/lib/utils";

import { UndefinedSuspenseIdError } from './problems';

import type { Injector, ProviderInstance, InjectionItem, PlainInjectionItem, InjectionArgument } from "@adi/core";
import type { InjectionHookResult } from "@adi/core/lib/hooks";

type SuspensePromise = Promise<any> & { status?: 'fulfilled' | 'rejected' | 'pending', error: any, value: any };

export type InjectionResult = InjectionHookResult<typeof InstanceHook>;

export function inject(injector: Injector, injectionItem: PlainInjectionItem): InjectionResult {
  const suspenseId = injectionItem.annotations.suspenseId;
  if (suspenseId !== undefined) {
    const cache = getSuspenseCache(injector);
    if (cache.has(suspenseId)) {
      return useSuspense(cache.get(suspenseId), cache);
    }
  }

  const arg = createInjectionArgument(injectionItem.token, injectionItem.hooks, { kind: InjectionKind.STANDALONE }, injectionItem.annotations);
  arg.hooks = [InstanceHook, ...arg.hooks];
  const injection = coreInject(injector, arg) as InjectionResult;
  if (isPromiseLike<InjectionResult>(injection)) {
    if (suspenseId !== undefined) {
      const cache = getSuspenseCache(injector);
      cache.set(suspenseId, injection as unknown as SuspensePromise);
      return useSuspense(injection as unknown as SuspensePromise, cache);
    }
    throw new UndefinedSuspenseIdError();
  }
  return injection;
}

export function injectMap(injector: Injector, injections: Record<string | symbol, InjectionArgument>): [Record<string | symbol, any>, Array<ProviderInstance>, Array<Promise<any>> | undefined] {
  const results: Record<string | symbol, any> = {};
  const instances: Array<ProviderInstance> = [];
  let asyncOperations: Array<Promise<any> | any> | undefined;

  getAllKeys(injections).forEach(key => {
    const injection = coreInject<InjectionResult>(injector, injections[key]);
    if (isPromiseLike(injection)) {
      asyncOperations = asyncOperations || [];
      return asyncOperations.push(
        wait(injection, ({ result, instance }) => {
          results[key] = result;
          instances.push(instance);
        }),
      );
    }
    results[key] = injection.result;
    instances.push(injection.instance);
  });

  return [results, instances, asyncOperations];
}

export function convertMapInjections(injections: Record<string | symbol, InjectionItem>): Record<string | symbol, InjectionArgument> {
  const converted: Record<string | symbol, InjectionArgument> = {}
  getAllKeys(injections).forEach(key => {
    const argument = converted[key] = convertInjection(injections[key], { kind: InjectionKind.STANDALONE });
    argument.hooks = [InstanceHook, ...argument.hooks];
  });
  return converted;
}

export function useDestroy(instances: ProviderInstance | Array<ProviderInstance>, sideEffects: boolean): void {
  useEffect(() => {
    if (sideEffects) {
      return () => { Promise.resolve(destroy(instances)) };
    }
  }, [instances]);
}

export const suspenseCacheMetaKey = 'adi:react:suspunse-cache';

function getSuspenseCache(injector: Injector): Map<string | symbol | object, SuspensePromise> {
  let suspenseCache = injector.meta[suspenseCacheMetaKey];
  if (suspenseCache === undefined) {
    suspenseCache = injector.meta[suspenseCacheMetaKey] = new Map<string | symbol | object, SuspensePromise>();
  }
  return suspenseCache;
}

function useSuspense(promise: SuspensePromise, cache: Map<string | symbol | object, SuspensePromise>) {
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
          cache.delete(promise);
        },
        error => {
          promise.status = 'rejected';
          promise.error = error;
          cache.delete(promise);
        },      
      );
      throw promise;
    }
  }
}
