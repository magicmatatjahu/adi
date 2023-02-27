import { inject as coreInject, serializeInjectArguments, createInjectionArgument } from '@adi/core/lib/injector';
import { InjectionKind } from '@adi/core/lib/enums';

import type { Injector, ProviderToken, InjectionHook, InjectionAnnotations, Session } from '@adi/core';

let currentContext: { injector: Injector, session: Session } | undefined = undefined;
export function setCurrentContext(ctx: { injector: Injector, session: Session } | undefined): { injector: Injector, session: Session } | undefined {
  const previous = currentContext;
  currentContext = ctx;
  return previous;
}

export function inject<T = any>(token?: ProviderToken<T>, session?: Session): T;
export function inject<T = any>(hook?: InjectionHook, session?: Session): T;
export function inject<T = any>(hooks?: Array<InjectionHook>, session?: Session): T;
export function inject<T = any>(annotations?: InjectionAnnotations, session?: Session): T;
export function inject<T = any>(token?: ProviderToken<T>, hook?: InjectionHook, session?: Session): T;
export function inject<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>, session?: Session): T;
export function inject<T = any>(token?: ProviderToken<T>, annotations?: InjectionAnnotations, session?: Session): T;
export function inject<T = any>(hook?: InjectionHook, annotations?: InjectionAnnotations): T;
export function inject<T = any>(hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations, session?: Session): T;
export function inject<T = any>(token?: ProviderToken<T>, hook?: InjectionHook, annotations?: InjectionAnnotations, session?: Session): T;
export function inject<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations, session?: Session): T;
export function inject<T = any>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations, session?: Session): T;
export function inject<T = any>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations, session?: Session): T {
  if (currentContext === undefined) {
    throw new Error('inject() must be called from an injection context such as a constructor, a factory function or field initializer.');
  }
  ({ token, hooks, annotations } = serializeInjectArguments(token as ProviderToken<T>, hooks as Array<InjectionHook>, annotations));
  const argument = createInjectionArgument(token as ProviderToken<T>, hooks as Array<InjectionHook>, { ...currentContext.session.iMetadata, kind: InjectionKind.CUSTOM, index: undefined, key: undefined, annotations });
  return coreInject(currentContext.injector, argument, session) as T;
}
