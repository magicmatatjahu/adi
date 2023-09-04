import { optimizedInject } from './resolver';
import { destroy } from './lifecycle-manager';
import { setCurrentInjectionContext, exitFromInjectionContext } from './inject';
import { createInjectionMetadata } from './metadata';
import { InjectionKind } from '../enums';
import { methodPatched, originalMethodDescriptor } from '../private';
import { noopThen, noopCatch, wait, waitAll, waitCallback } from '../utils';

import type { Injector } from "./injector";
import type { Session } from "./session";
import type { ClassType, InjectionArgument, InjectionMetadata, ProviderInstance, InjectionContext } from "../types";

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
  if (originalMethod[methodPatched]) {
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

    const { injector, session, injections } = ctxRegistry.get(this)!;
    const inject = injections[methodName];
    const toDestroy: ProviderInstance[] = [];
    let hasInjection = false;

    if (inject) {
      let dependency: InjectionArgument | undefined = undefined;
      for (let i = 0, l = inject.length; i < l; i++) {
        if (args[i] === undefined && (dependency = inject[i])) {
          hasInjection = true
          args[i] = optimizedInject(injector, dependency, session, undefined, toDestroy)
        }
      }
    }

    if (hasInjection === false) {
      const previosuContext = setCurrentInjectionContext({ injector, session, metadata });
      return wait(
        originalMethod.apply(this, args),
        noopThen,
        noopCatch,
        () => setCurrentInjectionContext(previosuContext)
      )
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

  adiPatchedMethod[originalMethodDescriptor] = descriptor;
  adiPatchedMethod[methodPatched] = true;
  target.prototype.method = adiPatchedMethod;
  return adiPatchedMethod;
}
