import { 
  FactoryProvider,
  ExistingProvider,
  ValueProvider,
  OnInit,
  OnDestroy,
} from "../interfaces";

export function isFactoryProvider(provider: unknown): provider is FactoryProvider {
  return typeof (provider as FactoryProvider).useFactory === "function";
}

export function isValueProvider(provider: unknown): provider is ValueProvider {
  return provider.hasOwnProperty("useValue");
}

export function isExistingProvider(provider: unknown): provider is ExistingProvider {
  return provider.hasOwnProperty("useExisting");
}

export function hasOnInitHook(instance: unknown): instance is OnInit {
  return instance !== undefined && typeof (instance as OnInit).onInit === "function";
}

export function hasOnDestroyHook(instance: unknown): instance is OnDestroy {
  return instance !== undefined && typeof (instance as OnDestroy).onDestroy === "function";
}
