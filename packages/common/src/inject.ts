import type { Injector, ProviderToken, InjectionHook, InjectionAnnotations, Session } from '@adi/core';

let currentInjector: Injector | undefined = undefined;
export function setCurrentInjector(injector: Injector): Injector | undefined {
  const previous = currentInjector;
  currentInjector = injector;
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
  if (currentInjector === undefined) {
    throw new Error('inject() must be called from an injection context such as a constructor, a factory function or field initializer.');
  }
  return currentInjector.get(token, hooks, annotations, session) as T;
}