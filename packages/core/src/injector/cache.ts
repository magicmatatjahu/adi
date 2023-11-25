import { resolveDynamicInstance, dynamicContext } from "./dynamic-context";
import { InstanceStatus } from "../enums";
import { cacheMetaKey } from "../private";

import type { Injector } from "./injector";
import type { Session } from "./session";
import type { InjectionArgument, ProviderToken } from "../types";

export type CacheToken = ProviderToken | InjectionArgument;
export type CacheEntry = {
  hasDynamic: boolean;
  value: any;
}

export function getFromCache<T>(injector: Injector, key: CacheToken, session?: Session): T | undefined {
  const cached = getCache(injector).get(key);
  if (!cached) {
    return;
  }

  const { hasDynamic, value } = cached;
  if (hasDynamic) {
    return resolveDynamicInstance(value, session?.dynamicCtx!);
  }
  return value;
}

export function saveToCache(injector: Injector, key: CacheToken, value: any, session: Session) {
  const instance = session.instance;
  getCache(injector).set(key, { hasDynamic: Boolean(instance && instance.status & InstanceStatus.HAS_DYNAMIC), value });
}

export function clearCache(injector: Injector): void {
  getCache(injector).clear();
}

function getCache(injector: Injector): Map<CacheToken, CacheEntry> {
  return injector.meta[cacheMetaKey];
}
