import { ProviderType } from "../enums";
import { 
  FactoryProvider,
  ExistingProvider,
  _CustomProvider,
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

export function isExistingProvider(provider: unknown): provider is ExistingProvider {
  return 'useExisting' in (provider as ExistingProvider);
}

export function isCustomProvider(provider: unknown): provider is _CustomProvider {
  return 'useCustom' in (provider as _CustomProvider);
}

// TODO: change it
const classType = ProviderType.TYPE | ProviderType.CLASS;
export function hasOnInitHook(instance: unknown, type: ProviderType): instance is OnInit {
  return classType & type && instance !== undefined && typeof (instance as OnInit).onInit === "function";
}

export function hasOnDestroyHook(instance: unknown): instance is OnDestroy {
  return instance !== undefined && typeof (instance as OnDestroy).onDestroy === "function";
}
