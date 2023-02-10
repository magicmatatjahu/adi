import { createHook, wait } from '@adi/core';

import type { Injector, InjectionMetadata, Session, NextInjectionHook } from '@adi/core';

export interface CacheHookOptions {
  force?: boolean;
}

const cache: WeakMap<Injector, WeakMap<InjectionMetadata, any>> = new WeakMap();

function createSubCache(injector: Injector) {
  const subCache = new WeakMap<InjectionMetadata, any>();
  cache.set(injector, subCache);
  return subCache;
}

function hook(force: boolean = false) {
  return (session: Session, next: NextInjectionHook) => {
    const injector = session.context.injector;
    const subCache = cache.get(injector) || createSubCache(injector);
  
    const value = subCache.get(session.iMetadata);
    if (value) {
      return value;
    }
  
    return wait(
      next(session),
      result => {
        if (force === false && session.hasFlag('side-effect')) {
          return result;
        }
        
        if (session.iMetadata) {
          subCache.set(session.iMetadata, result);
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
