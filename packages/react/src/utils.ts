import { InjectionKind } from "@adi/core/lib/enums";
import { inject as coreInject, createInjectionArgument, convertInjection } from "@adi/core/lib/injector";
import { HasSideEffect } from "@adi/core/lib/hooks/internal";
import { getAllKeys } from "@adi/core/lib/utils";

import type { Injector, ProviderInstance, InjectionItem, PlainInjectionItem, InjectionArgument } from "@adi/core";

export type InjectionResult<T = any> = { result: T, instance: ProviderInstance<T>, has: boolean };
export type InjectionResultMap = { results: Record<string | symbol, any>, instances: Array<ProviderInstance>, hasSideEffect: boolean };

const hasSideEffectHook = HasSideEffect();

export function inject<T>(injector: Injector, injectionItem: PlainInjectionItem): InjectionResult<T> {
  const arg = createInjectionArgument(injectionItem.token, injectionItem.hooks, { kind: InjectionKind.STANDALONE }, injectionItem.annotations);
  arg.hooks = [hasSideEffectHook, ...arg.hooks];
  return coreInject(injector, arg) as InjectionResult<T>;
}

export function injectMap(injector: Injector, injections: Record<string | symbol, InjectionArgument>): InjectionResultMap {
  const results = {};
  const instances = [];
  let hasSideEffect = false;

  const result: InjectionResultMap = { results, instances, hasSideEffect };
  getAllKeys(injections).forEach(key => {
    const { result, instance, has } = coreInject(injector, injections[key]) as InjectionResult;
    results[key] = result;
    instances.push(instance);
    hasSideEffect = hasSideEffect || has;
  });
  result.hasSideEffect = hasSideEffect;

  return result;
}

export function convertMapInjections(injections: Record<string | symbol, InjectionItem>): Record<string | symbol, InjectionArgument> {
  const converted: Record<string | symbol, InjectionArgument> = {}
  getAllKeys(injections).forEach(key => {
    const argument = converted[key] = convertInjection(injections[key], { kind: InjectionKind.STANDALONE });
    argument.hooks = [hasSideEffectHook, ...argument.hooks];
  });
  return converted;
}
