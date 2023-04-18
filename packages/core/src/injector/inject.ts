import { serializeInjectArguments, createInjectionArgument } from './metadata';
import { destroy } from './lifecycle-manager';
import { inject as coreInject } from './resolver';
import { InjectionKind } from '../enums';
import { SessionHook } from '../hooks';
import { instancesToDestroyMetaKey } from '../private';
import { wait, waitCallback } from '../utils';

import type { Injector } from './injector';
import type { Session } from './session';
import type { ProviderToken, InjectionHook, InjectionAnnotations, InjectionMetadata } from '../interfaces';

export interface CurrentInjectionContext {
  injector: Injector;
  session: Session;
  metadata?: InjectionMetadata;
}

export interface InjectionData {
  inject: typeof inject,
}

let currentContext: CurrentInjectionContext | undefined = undefined;
export function setCurrentInjectionContext(ctx: CurrentInjectionContext | undefined): CurrentInjectionContext | undefined {
  const previous = currentContext;
  currentContext = ctx;
  return previous;
}

const sessionHook = SessionHook();
const defaultInjectionMetadata: InjectionMetadata = {
  kind: InjectionKind.UNKNOWN,
  target: undefined,
  key: undefined,
  index: undefined,
  descriptor: undefined,
  function: undefined,
  static: false,
  annotations: undefined,
}

function baseInject<T>(ctx: CurrentInjectionContext, token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): T | Promise<T> {
  ({ token, hooks, annotations } = serializeInjectArguments(token as ProviderToken<T>, hooks as Array<InjectionHook>, annotations));
  const { injector, session, metadata = {} } = ctx;
  const injectMetadata = { ...defaultInjectionMetadata, ...metadata, annotations }

  const instancesToDestroy = currentContext[instancesToDestroyMetaKey];
  if (instancesToDestroy === undefined) {
    const argument = createInjectionArgument(token as ProviderToken<T>, hooks as Array<InjectionHook>, injectMetadata);
    return coreInject(injector, argument, session) as T;
  }

  const argument = createInjectionArgument(token as ProviderToken<T>, [sessionHook, ...hooks as Array<InjectionHook>], injectMetadata);
  return wait(
    coreInject(injector, argument, session),
    ({ result, session: s }: { result: any, session: Session }) => {
      if (s.hasFlag('side-effect')) {
        instancesToDestroy.push(s.context.instance);
      }
      return result;
    }
  ) as T;
}

export function inject<T = any>(token?: ProviderToken<T>): T;
export function inject<T = any>(hook?: InjectionHook): T;
export function inject<T = any>(hooks?: Array<InjectionHook>): T;
export function inject<T = any>(annotations?: InjectionAnnotations): T;
export function inject<T = any>(token?: ProviderToken<T>, hook?: InjectionHook): T;
export function inject<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>): T;
export function inject<T = any>(token?: ProviderToken<T>, annotations?: InjectionAnnotations): T;
export function inject<T = any>(hook?: InjectionHook, annotations?: InjectionAnnotations): T;
export function inject<T = any>(hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): T;
export function inject<T = any>(token?: ProviderToken<T>, hook?: InjectionHook, annotations?: InjectionAnnotations): T;
export function inject<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): T;
export function inject<T = any>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): T;
export function inject<T = any>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): T {
  if (currentContext === undefined) {
    throw new Error('inject() must be called from an injection context such as a constructor, a factory function or field initializer.');
  }
  return baseInject(currentContext, token, hooks, annotations) as T;
}

export function injectMethod<T, F extends (...args: any) => any>(instance: T, method: F): F {
  if (currentContext === undefined) {
    throw new Error('injectMethod() must be called inside constructor!');
  }

  const { injector, session } = currentContext;
  const target = (instance as any).constructor;
  const descriptor = Object.getOwnPropertyDescriptor((target as any).prototype, method.name);
  const methodCtx = { 
    injector,
    session,
    metadata: {
      kind: InjectionKind.METHOD,
      target,
      descriptor,
    }
  };

  return function(...args: any[]) {
    const ctxInstances: any[] = [];
    const ctx = { ...methodCtx, [instancesToDestroyMetaKey]: ctxInstances }
    const previosuContext = setCurrentInjectionContext(ctx);
    try {
      return waitCallback(
        () => method.apply(instance, args),
        undefined,
        undefined,
        () => destroy(ctxInstances),
      )
    } finally {
      setCurrentInjectionContext(previosuContext)
    }
  } as F
}

export function runInInjectionContext<R>(fn: (data: InjectionData) => R, ctx: CurrentInjectionContext): R {
  function ctxInject<T>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations) {
    return baseInject(ctx, token, annotations)
  };

  const previosuContext = setCurrentInjectionContext(ctx);
  try {
    return fn({ inject: ctxInject });
  } finally {
    setCurrentInjectionContext(previosuContext);
  }
}
