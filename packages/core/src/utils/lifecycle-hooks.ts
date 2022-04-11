import { waitSequentially } from "./wait";

import type { Session } from "../injector";
import type { ProviderInstance, OnDestroy, OnInit } from "../interfaces";

function hasOnInitLifecycle(instance: unknown): instance is OnInit {
  return instance && typeof (instance as OnInit).onInit === 'function';
}

export const INIT_HOOKS_KEY = 'adi:lifecycle:on-init';
export function handleOnInitLifecycle(instance: ProviderInstance, then: () => any) {
  const value = instance.value;
  const hooks = (instance.meta[INIT_HOOKS_KEY] || []) as Array<Function>;
  hasOnInitLifecycle(value) && hooks.unshift(() => value.onInit.bind(value));
  return waitSequentially(hooks, hook => hook(), then);
}

function hasOnDestroyLifecycle(instance: unknown): instance is OnDestroy {
  return instance && typeof (instance as OnDestroy).onDestroy === 'function';
}

export const DESTROY_HOOKS_KEY = 'adi:lifecycle:on-destroy';
export async function handleOnDestroyLifecycle(instance: ProviderInstance) {
  const value = instance.value;
  hasOnDestroyLifecycle(value) && await value.onDestroy();
  const hooks = (instance.meta[DESTROY_HOOKS_KEY]) as Array<Function>;
  if (!hooks) return;

  for (let i = 0, l = hooks.length; i < l; i++) {
    await hooks[i]();
  }
  delete instance.meta[DESTROY_HOOKS_KEY];
}
