import { InjectionItem, Injector, InstanceRecord, Internal, ValueProvider, when } from "@adi/core";
import { Token } from "@adi/core/lib/types";
import { isWrapper, Wrapper } from "@adi/core/lib/utils";

import { ComponentProvider } from "./interfaces";
import { COMPONENT_TOKEN } from "./constants";

export function createComponentProvider(componentProvider: ComponentProvider): ValueProvider {
  return {
    provide: COMPONENT_TOKEN,
    useValue: componentProvider.component,
    useWrapper: componentProvider.useWrapper,
    when: when.named(componentProvider.name),
  };
}

const instanceWrapper = Internal('instance');
export function wrap(wrappers: Wrapper | Wrapper[]): Wrapper | Wrapper[] {
  if (Array.isArray(wrappers)) {
    return [instanceWrapper, ...wrappers];
  }
  return wrappers ? [instanceWrapper, wrappers] : instanceWrapper;
}

export function injectArray(injector: Injector, injections: Array<InjectionItem>): { values: any[], instances: InstanceRecord[] } {
  const result: { values: any[], instances: InstanceRecord[] } = { values: [], instances: [] }
  for (let i = 0, l = injections.length; i < l; i++) {
    const provider = injections[i];
    const [value, instance] = inject(injector, provider);
    result.values.push(value); result.instances.push(instance);
  }
  return result;
}

export function injectMap(injector: Injector, injections: Record<string | symbol, InjectionItem>): { values: Record<string | symbol, any>, instances: InstanceRecord[] } {
  const result: { values: Record<string | symbol, any>, instances: InstanceRecord[] } = { values: {}, instances: [] }, keys = Object.keys(injections);
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i];
    const [value, instance] = inject(injector, injections[key]);
    result.values[key] = value; result.instances.push(instance);
  }
  return result;
}

function inject<T>(injector: Injector, injectionItem: InjectionItem<T>): [T, InstanceRecord<T>] {
  if (isWrapper(injectionItem)) {
    return injector.get(undefined, wrap(injectionItem));
  }
  if ((injectionItem as any).token !== undefined) {
    return injector.get((injectionItem as any).token, wrap((injectionItem as any).wrapper));
  }
  return injector.get(injectionItem as Token, instanceWrapper);
}
