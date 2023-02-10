import { providesDefinitions } from '../decorators/provides';

import type { ClassType, InjectionItem } from '@adi/core';
import type { Provider, ClassicProvider } from '../interfaces';

export function isClassicProvider(provider: unknown): provider is ClassicProvider {
  const useProvider = (provider as ClassicProvider).useProvider;
  return useProvider && (
    (typeof (useProvider as ClassType<ClassicProvider>).prototype.provide === 'function' || typeof (useProvider as Provider).provide === 'function') ||
    providesDefinitions.get(useProvider) !== undefined
  );
}

export function hasInjections(value: unknown): value is { inject: Array<InjectionItem> } {
  return value && Boolean((value as { inject: Array<InjectionItem> }).inject);
}
