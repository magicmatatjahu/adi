import { InjectionKind } from "@adi/core/lib/enums";
import { inject as coreInject, createInjectionArgument, convertInjection } from "@adi/core/lib/injector";
import { HasSideEffect } from "@adi/core/lib/hooks/internal";
import { getAllKeys, isPromiseLike, wait } from "@adi/core/lib/utils";

import type { Injector, ProviderInstance, InjectionItem, PlainInjectionItem, InjectionArgument } from "@adi/core";

export type InjectionResult<T = any> = { result: T, instance: ProviderInstance<T>, sideEffects: boolean };

const hasSideEffectHook = HasSideEffect();

export function inject<T>(injector: Injector, injectionItem: PlainInjectionItem): InjectionResult<T> {
  const arg = createInjectionArgument(injectionItem.token, injectionItem.hooks, { kind: InjectionKind.STANDALONE }, injectionItem.annotations);
  arg.hooks = [hasSideEffectHook, ...arg.hooks];
  return coreInject(injector, arg) as InjectionResult<T>;
}

export function injectMap(injector: Injector, injections: Record<string | symbol, InjectionArgument>): [Record<string | symbol, any>, Array<ProviderInstance>, boolean, Array<Promise<any>> | undefined] {
  const results = {};
  const instances = [];
  let asyncOps: Array<Promise<any> | any> | undefined;
  let sideEffects = false;

  getAllKeys(injections).forEach(key => {
    const injected = coreInject<InjectionResult>(injector, injections[key]);
    if (isPromiseLike(injected)) {
      asyncOps = asyncOps || [];
      return asyncOps.push(
        wait(injected, result => {
          results[key] = result.result;
          instances.push(result.instance);
          sideEffects = sideEffects || result.sideEffects;
        }),
      );
    }

    results[key] = injected.result;
    instances.push(injected.instance);
    sideEffects = sideEffects || injected.sideEffects;
  });

  return [results, instances, sideEffects, asyncOps];
}

export function convertMapInjections(injections: Record<string | symbol, InjectionItem>): Record<string | symbol, InjectionArgument> {
  const converted: Record<string | symbol, InjectionArgument> = {}
  getAllKeys(injections).forEach(key => {
    const argument = converted[key] = convertInjection(injections[key], { kind: InjectionKind.STANDALONE });
    argument.hooks = [hasSideEffectHook, ...argument.hooks];
  });
  return converted;
}
