import { inject as coreInject } from "@adi/core/lib/injector/resolver";
import { InstanceHook } from "@adi/core/lib/hooks/internal";
import { getCurrentInstance } from 'vue-demi';

import type { Injector, ProviderInstance, PlainInjectionItem } from "@adi/core";

export type InjectionResult<T = any> = { result: T, instance: ProviderInstance<T>, sideEffects: boolean };

export function inject<T>(injector: Injector, argument: PlainInjectionItem): InjectionResult<T> {
  argument.hooks = [InstanceHook, ...argument.hooks];
  return coreInject(injector, argument) as InjectionResult<T>;
}

export function assertEnv() {
  const vm = getCurrentInstance()?.proxy;
  if (!vm) {
    throw new Error('adi can only be used inside setup() function.')
  }
}
