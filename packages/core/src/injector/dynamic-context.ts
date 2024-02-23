import { resolvedInstances } from './provider';
import { InstanceStatus } from '../enums';
import { dynamicInstancesMetaKey, dynamicContextMetaKey } from '../private';
import { wait, waitAll } from '../utils';

import type { ProviderInstance } from "./provider";
import type { Session } from "./session";

export const dynamicContexts = new WeakMap<object, { proxies: Map<object, any>, toDestroy: ProviderInstance[] }>();

export function applyDynamicContext(instance: ProviderInstance, session: Session): void {
  const acc: ProviderInstance[] = []

  let parent = session.parent;
  while (parent) {
    const parentInstance = parent.instance!;
    parentInstance.status |= InstanceStatus.HAS_DYNAMIC_SCOPE
    const meta = parentInstance.meta;
    
    const proxies: Set<ProviderInstance> = meta[dynamicInstancesMetaKey] || (meta[dynamicInstancesMetaKey] = new Set());
    proxies.add(instance);

    if (parent.hasFlag('dynamic-resolution')) {
      parent.data.middleInstances = acc;
      return
    } else {
      acc.forEach(i => proxies.add(i));
    }
    acc.push(parentInstance)

    parent = parent.parent;
  }
}

export function resolveDynamicInstance<T>(ref: any, ctx: object): T {
  const instance = resolvedInstances.get(ref)
  const canProcess = instance && instance?.status & InstanceStatus.HAS_DYNAMIC_SCOPE;
  if (!canProcess) {
    return ref;
  }

  let sharedCtx = dynamicContexts.get(ctx);
  if (!sharedCtx) {
    dynamicContexts.set(ctx, sharedCtx = { proxies: new Map(), toDestroy: [] })
  }

  return resolveProxy(ref, instance, ctx, sharedCtx.proxies, sharedCtx.toDestroy)
}

export function resolveProxy<T>(ref: any, instance: ProviderInstance, ctx: object, proxies: Map<object, any>, toDestroy: ProviderInstance[]): T {
  const injections: any[] = [];
  
  const instances: Set<ProviderInstance> = instance.meta[dynamicInstancesMetaKey];
  instances.forEach(({ definition, session, value: instanceRef }) => {
    if (session.hasFlag('dynamic-scope') === false) {
      proxies.set(instanceRef, createProxy(instanceRef, proxies))
      return
    }

    const forked = session.fork();
    forked.setFlag('dynamic-resolution');
    forked.dynamicCtx = ctx;

    injections.push(
      wait(
        definition.instance(forked),
        instance => wait(
          instance.resolve(forked),
          value => {
            toDestroy.push(instance);

            const middleInstances: ProviderInstance[] | undefined = forked.data.middleInstances;
            if (middleInstances) {
              middleInstances.forEach(i => proxies.set(i.value, createProxy(i.value, proxies)))
            }

            if (instance.status & InstanceStatus.HAS_DYNAMIC_SCOPE) {
              return injections.push(
                wait(
                  resolveProxy<any>(value, instance, ctx, proxies, toDestroy),
                  nextValue => proxies.set(instanceRef, nextValue),
                )
              )
            }
            
            proxies.set(instanceRef, createProxy(value, proxies));
          }
        )
      )
    );
  })

  const proxy = createProxy(ref, proxies);
  proxy[dynamicContextMetaKey] = ctx;
  resolvedInstances.set(proxy, instance)
  return waitAll(injections, () => proxy);
}

function createProxy<T extends object>(ref: T, instances: Map<object, any>): T {
  return new Proxy(ref, {
    get(target, key) {
      const value = target[key];
      return instances.get(value) || value;
    },
  })
}