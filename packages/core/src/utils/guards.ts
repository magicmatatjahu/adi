import { InjectionToken, ModuleToken } from '../tokens';
import type { ProviderToken, ClassProvider, FactoryProvider, ClassicProvider, ValueProvider, ExistingProvider, ExtendedModule, AdiProvider, ClassType } from '../interfaces';
import { provideDefinitions } from '../injector';

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

export function isClassicProvider(provider: unknown): provider is ClassicProvider {
  const useProvider = (provider as ClassicProvider).useProvider;
  return useProvider && (
    (typeof (useProvider as ClassType<ClassicProvider>).prototype.provide === 'function' || typeof (useProvider as AdiProvider).provide === 'function') ||
    provideDefinitions.get(useProvider) !== undefined
  );
}

export function isProviderToken(token: unknown): token is ProviderToken {
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
