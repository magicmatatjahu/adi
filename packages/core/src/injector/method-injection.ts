import { injectArgument } from './resolver';
import { setCurrentInjectionContext, exitFromInjectionContext } from './inject';
import { createInjectionMetadata } from './metadata';
import { InjectionKind } from '../enums';
import { methodPatchedMetaKey, originalMethodMetaKey } from '../private';
import { noopThen, noopCatch, waitAll, waitCallback } from '../utils';

import type { Injector } from "./injector";
import type { ProviderInstance } from "./provider";
import type { Session } from "./session";
import type { ClassType, InjectionArgument, InjectionContext, InjectionMetadata } from "../types";

type RegistryItem = {
  injector: Injector;
  session: Session;
  injections: Record<string | symbol, Array<InjectionArgument | undefined>>
}

const ctxRegistry = new WeakMap<object, RegistryItem>()

export type PatchMethodContext = {
  methodName: string | symbol
}

export function setInstanceContext(instance: any, ctx: RegistryItem) {
  if (ctxRegistry.has(instance) === false) {
    ctxRegistry.set(instance, ctx)
  }
}

export function patchMethods(target: ClassType, methodNames: Array<string | symbol>) {
  methodNames.forEach(method => patchMethod(target, method));
}

export function patchMethod(target: ClassType, methodName: string | symbol) {
  const proto = target.prototype;
  const originalMethod = proto[methodName]
  if (originalMethod[methodPatchedMetaKey]) {
    return originalMethod;
  }

  const descriptor = Object.getOwnPropertyDescriptor(proto, methodName)
  const metadata: InjectionMetadata = createInjectionMetadata({
    kind: InjectionKind.METHOD,
    target,
    key: methodName,
    descriptor,
  });

  // TODO: save cached injections
  function methodInjection(this: object, ...args: any[]) {
    const ctx = ctxRegistry.get(this) as RegistryItem;
    const { injector, session, injections } = ctx
    const inject = injections[methodName];
    const toDestroy: ProviderInstance[] = [];

    if (inject) {
      const injectionCtx: Partial<InjectionContext> = { toDestroy }
      let dependency: InjectionArgument | undefined = undefined;
      for (let i = 0, l = inject.length; i < l; i++) {
        if (args[i] === undefined && (dependency = inject[i])) {
          args[i] = injectArgument(injector, dependency, session, injectionCtx)
        }
      }
    }

    const previosuContext = setCurrentInjectionContext({ injector, session, metadata });
    return waitAll(
      args,
      result => waitCallback(
        () => originalMethod.apply(this, result),
        noopThen,
        noopCatch,
        () => exitFromInjectionContext(toDestroy, previosuContext)
      ),
    );
  }

  Object.defineProperty(methodInjection, 'name', { value: methodName });
  methodInjection[originalMethodMetaKey] = originalMethod;
  methodInjection[methodPatchedMetaKey] = true;
  return proto[methodName] = methodInjection;
}
