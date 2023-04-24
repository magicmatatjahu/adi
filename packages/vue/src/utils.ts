import { InjectionKind } from "@adi/core/lib/enums";
import { inject as coreInject, createInjectionArgument } from "@adi/core/lib/injector";
import { InstanceHook } from "@adi/core/lib/hooks/internal";
import { getCurrentInstance } from 'vue-demi';

import type { Injector, ProviderInstance, PlainInjectionItem } from "@adi/core";

export type InjectionResult<T = any> = { result: T, instance: ProviderInstance<T>, sideEffects: boolean };

export function inject<T>(injector: Injector, injectionItem: PlainInjectionItem): InjectionResult<T> {
  const arg = createInjectionArgument(injectionItem.token, injectionItem.hooks, { kind: InjectionKind.STANDALONE }, injectionItem.annotations);
  arg.hooks = [InstanceHook, ...arg.hooks];
  return coreInject(injector, arg) as InjectionResult<T>;
}

export function assertEnv() {
  const vm = getCurrentInstance()?.proxy;
  if (!vm) {
    throw new Error('adi can only be used inside setup() function.')
  }
}
