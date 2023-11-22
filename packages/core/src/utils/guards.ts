import { InjectionToken, ModuleToken } from '../tokens';

import type { ProviderToken, ClassProvider, FactoryProvider, ClassicProvider, ValueProvider, ExistingProvider, ExtendedModule, Provide, ClassType, OnInit, OnDestroy } from '../types';

export function isClassProvider(provider: unknown): provider is ClassProvider {
  return 'useClass' in (provider as ClassProvider);
}

export function isFactoryProvider(provider: unknown): provider is FactoryProvider {
  return typeof (provider as FactoryProvider).useFactory === "function";
}

export function isValueProvider(provider: unknown): provider is ValueProvider {
  return 'useValue' in (provider as ValueProvider);
}

export function isExistingProvider(provider: unknown): provider is ExistingProvider {
  return 'useExisting' in (provider as ExistingProvider);
}

export function isClassFactoryProvider(provider: unknown): provider is ClassicProvider {
  const factory = (provider as ClassicProvider).useFactory as ClassType<Provide>;
  return typeof factory?.prototype?.provide === 'function';
}

export function isProviderToken<T = any>(token: unknown): token is ProviderToken<T> {
  const typeOf = typeof token;
  return typeOf === 'function' || isInjectionToken(token) || typeOf === 'string' || typeOf === 'symbol';
}

export function isInjectionToken(provider: unknown): provider is InjectionToken {
  return provider instanceof InjectionToken;
}

export function isModuleToken(module: unknown): module is ModuleToken {
  return module instanceof ModuleToken;
}

export function isExtendedModule(module: unknown): module is ExtendedModule {
  return 'extends' in (module as ExtendedModule);
}

export function hasOnInitLifecycle(instance: unknown): instance is OnInit {
  return !!instance && typeof (instance as OnInit).onInit === 'function';
}

export function hasOnDestroyLifecycle(instance: unknown): instance is OnDestroy {
  return !!instance && typeof (instance as OnDestroy).onDestroy === 'function';
}