import { optimizedInject } from './resolver';
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
  const originalMethod = target.prototype[methodName]
  if (originalMethod[methodPatchedMetaKey]) {
    return originalMethod;
  }

  const descriptor = Object.getOwnPropertyDescriptor(target.prototype, methodName)
  const metadata: InjectionMetadata = createInjectionMetadata({
    kind: InjectionKind.METHOD,
    target,
    key: methodName,
    descriptor,
  });

  function adiPatchedMethod(this: object, ...args: any[]) {
    const ctx = ctxRegistry.get(this);
    if (!ctx) {
      return originalMethod.apply(this, args);
    }

    const { injector, session, injections } = ctx
    const inject = injections[methodName];
    const toDestroy: ProviderInstance[] = [];

    if (inject) {
      const injectionCtx: Partial<InjectionContext> = { toDestroy }
      let dependency: InjectionArgument | undefined = undefined;
      for (let i = 0, l = inject.length; i < l; i++) {
        if (args[i] === undefined && (dependency = inject[i])) {
          args[i] = optimizedInject(injector, session, dependency, injectionCtx)
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

  adiPatchedMethod[originalMethodMetaKey] = originalMethod;
  adiPatchedMethod[methodPatchedMetaKey] = true;
  target.prototype.method = adiPatchedMethod;
  return adiPatchedMethod;
}
