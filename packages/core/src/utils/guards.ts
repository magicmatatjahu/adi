import { NULL_REF, WRAPPER_DEF } from "../constants";
import { 
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  WrapperProvider,
  ValueProvider,
  // CustomProvider,
  OnInit,
  OnDestroy,
  WrapperDef,
  DynamicModule,
  Type,
} from "../interfaces";
import { NewWrapper, Wrapper } from "./wrappers";

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
  const wrapper = (provider as WrapperProvider).useWrapper;
  return wrapper && (wrapper as Wrapper).$$wr === NULL_REF;
}

export function hasNewWrapperProvider(provider: unknown): provider is WrapperProvider {
  const wrapper = (provider as WrapperProvider).useWrapper;
  return wrapper && (
    (wrapper as NewWrapper).$$wr === WRAPPER_DEF || 
    Array.isArray(wrapper)
  );
}

export function isWrapper(wrapper: unknown): wrapper is Wrapper {
  return wrapper && (wrapper as Wrapper).$$wr === NULL_REF;
}

export function isNewWrapper(wrapper: unknown): wrapper is NewWrapper {
  return wrapper && (wrapper as NewWrapper).$$wr === WRAPPER_DEF;
}

export function isDynamicModule(module: Type | DynamicModule): module is DynamicModule {
  return typeof (module as DynamicModule).module === 'function';
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