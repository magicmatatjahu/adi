import { cacheMetaKey } from '../private';

import type { Injector } from './injector';
import type { InjectionArgument, ProviderToken } from '../types';

export function getFromCache<T>(injector: Injector, key: InjectionArgument | ProviderToken): T {
  return injector.meta[cacheMetaKey].get(key);
}

export function saveToCache(injector: Injector, key: InjectionArgument | ProviderToken, value: any): void {
  injector.meta[cacheMetaKey].set(key, value);
}

// TODO: Remove from cache also the injection arguments (use for that tokens) 
export function removeCache(injector: Injector, key: InjectionArgument | ProviderToken): void {
  injector.meta[cacheMetaKey].delete(key);
}