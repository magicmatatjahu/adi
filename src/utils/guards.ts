import { 
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  WrapperProvider,
  ValueProvider,
  OnInit,
  OnDestroy,
} from "../interfaces";

export function isFactoryProvider(provider: unknown): provider is FactoryProvider {
  return typeof (provider as FactoryProvider).useFactory === "function";
}

export function isValueProvider(provider: unknown): provider is ValueProvider {
  return 'useValue' in (provider as ValueProvider);
}

export function isClassProvider(provider: unknown): provider is ClassProvider {
  return 'useClass' in (provider as ClassProvider);
}

export function isExistingProvider(provider: unknown): provider is ExistingProvider {
  return 'useExisting' in (provider as ExistingProvider);
}

export function hasWrapperProvider(provider: unknown): provider is WrapperProvider {
  return typeof (provider as WrapperProvider).useWrapper === "function";
}

export function hasOnInitHook(instance: unknown): instance is OnInit {
  return instance && typeof (instance as OnInit).onInit === "function";
}

export function hasOnDestroyHook(instance: unknown): instance is OnDestroy {
  return instance && typeof (instance as OnDestroy).onDestroy === "function";
}

export function isPromiseLike<T>(maybePromise: any): maybePromise is PromiseLike<T> {
  return maybePromise && typeof maybePromise.then === 'function';
}
