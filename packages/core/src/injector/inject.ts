import { serializeInjectArguments, createInjectionArgument } from './metadata';
import { inject as coreInject, injectMethod as coreInjectMethod } from './resolver';
import { InjectionKind } from '../enums';
import { instancesToDestroyMetaKey } from '../private';

import type { Injector } from './injector';
import type { Session } from './session';
import type { ProviderToken, InjectionHook, InjectionAnnotations, InjectionMetadata } from '../interfaces';

export interface CurrentInjectionContext {
  injector: Injector;
  session: Session;
  metadata?: InjectionMetadata;
}

let currentContext: CurrentInjectionContext | undefined = undefined;
export function setCurrentInjectionContext(ctx: CurrentInjectionContext | undefined): CurrentInjectionContext | undefined {
  const previous = currentContext;
  currentContext = ctx;
  return previous;
}

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
  ({ token, hooks, annotations } = serializeInjectArguments(token as ProviderToken<T>, hooks as Array<InjectionHook>, annotations));

  const { injector, session: parent, metadata = {} } = currentContext;
  const argument = createInjectionArgument(token as ProviderToken<T>, hooks as Array<InjectionHook>, { ...defaultInjectionMetadata, ...metadata, annotations });
  return coreInject(injector, argument, parent) as T;
}

export function injectMethod<T, F extends (...args: any) => any>(instance: T, method: F): F {
  if (currentContext === undefined) {
    throw new Error('injectMethod() must be called inside constructor!');
  }

  const { injector, session } = currentContext;
  return coreInjectMethod(injector, instance, method, [], session) as F;
}

export function runInInjectionContext<R>(fn: () => R, ctx: CurrentInjectionContext): R {
  const previosuContext = setCurrentInjectionContext(ctx);
  try {
    return fn();
  } finally {
    setCurrentInjectionContext(previosuContext);
  }
}