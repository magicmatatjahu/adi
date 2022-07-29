import { useEffect } from "react";
import { InjectionKind } from "@adi/core";
import { inject as coreInject, convertDependency, destroy } from "@adi/core/lib/injector";
import { WithInstance } from "@adi/core/lib/hooks/internal";

import type { Injector, ProviderInstance, InjectionItem } from "@adi/core";

const withInstaneHook = WithInstance();

export type InjectionResult<T> = { value: T, instance: ProviderInstance<T> };

export function inject<T>(injector: Injector, injectionItem: InjectionItem<T>): InjectionResult<T> {
  const arg = convertDependency(injectionItem, { kind: InjectionKind.STANDALONE });
  arg.hooks = [withInstaneHook, ...arg.hooks]
  return coreInject(injector, undefined, arg) as InjectionResult<T>;
}

export function injectArray(injector: Injector, injections: Array<InjectionItem>): { values: any[], instances: Array<ProviderInstance> } {
  const result: { values: Array<any>, instances: Array<ProviderInstance> } = { values: [], instances: [] }
  for (let i = 0, l = injections.length; i < l; i++) {
    const { value, instance } = inject(injector, injections[i]);
    result.values.push(value);
    result.instances.push(instance);
  }
  return result;
}

export function injectMap(injector: Injector, injections: Record<string, InjectionItem>): { values: Record<string, any>, instances: Array<ProviderInstance> } {
  const result: { values: Record<string | symbol, any>, instances: Array<ProviderInstance> } = { values: {}, instances: [] }
  const keys = Object.keys(injections);
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i];
    const { value, instance } = inject(injector, injections[key]);
    result.values[key] = value;
    result.instances.push(instance);
  }
  return result;
}

export function useDestroy(instance: ProviderInstance): void;
export function useDestroy(instances: Array<ProviderInstance>): void;
export function useDestroy(instances: ProviderInstance | Array<ProviderInstance>): void {
  useEffect(() => {
    return () => {
      // use setTimeout to add destruction to the end of event loop
      setTimeout(() => {
        destroy(instances);
      }, 0);
    };
  }, []);
}