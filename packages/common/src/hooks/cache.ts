import { createHook, wait } from '@adi/core';
// import { resolveInstance } from '@adi/core/lib/injector';

import type { Injector, InjectionMetadata, Session, NextInjectionHook } from '@adi/core';

export interface CacheHookOptions {
  force?: boolean;
}

type CacheValue = { value: any, prov: Session };
const cache: WeakMap<Injector, WeakMap<InjectionMetadata, CacheValue>> = new WeakMap();

export function createSubCache(injector: Injector) {
  const subCache = new WeakMap<InjectionMetadata, CacheValue>();
  cache.set(injector, subCache);
  return subCache;
}

export function destroySubCache(injector: Injector) {
  cache.delete(injector);
}

function hook(force: boolean = false) {
  return (session: Session, next: NextInjectionHook) => {
    const subCache = cache.get(session.context.injector);
    const maybeCached = subCache.get(session.iMetadata);
    if (maybeCached !== undefined) {
      const { value, prov } = maybeCached;
      if (value !== undefined) {
        return value;
      }
      // if (prov !== undefined) {
      //   // TODO: check if it will overwrite important values in performed session.
      //   session.apply(prov);
      //   return resolveInstance(session);
      // }
    }
  
    return wait(
      next(session),
      result => {
        if (force === false && session.hasFlag('side-effect') === true) {
          // if (session.hasFlag('dynamic') === false) {
          //   subCache.set(session.iMetadata, { value: undefined, prov: session });
          // }
          return result;
        }
        if (session.iMetadata) {
          subCache.set(session.iMetadata, { value: result, prov: undefined });
        }
        return result;
      }
    );
  }
}

const defaultHook = hook(false);

export const Cache = createHook((options?: CacheHookOptions) => {
  if (!options || !options.force) {
    return defaultHook;
  }
  return hook(options.force);
}, { name: "adi:hook:cache" });
