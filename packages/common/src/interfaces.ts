import type { ProviderToken, InjectionHook, ConstraintDefinition, ProviderAnnotations, ScopeType, ClassType, AbstractClassType, ModuleImportType, ProviderType } from '@adi/core';

export interface ProvidesOptions<T = any> {
  provide?: ProviderToken<T>;
  hooks?: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;
  scope?: ScopeType;
}

export interface ProvideDefinition {
  prototype: Record<string | symbol, ProvidesOptions>;
  static: Record<string | symbol, ProvidesOptions>;
}

export interface CollectionProvider {
  useCollection: ClassType | AbstractClassType;
}

declare module '@adi/core' {
  export interface ClassProvider {
    imports?: Array<ModuleImportType>;
    providers?: Array<ProviderType>;
    useCollection?: never;
  }

  export interface FactoryProvider {
    imports?: Array<ModuleImportType>;
    providers?: Array<ProviderType>;
    useCollection?: never;
  }

  export interface ClassFactoryProvider {
    imports?: Array<ModuleImportType>;
    providers?: Array<ProviderType>;
    useCollection?: never;
  }

  export interface ValueProvider {
    imports?: never;
    providers?: never;
    useCollection?: never;
  }

  export interface ExistingProvider {
    imports?: never;
    providers?: never;
    useCollection?: never;
  }

  export interface HookProvider {
    imports?: never;
    providers?: never;
    useCollection?: never;
  }

  export interface CustomProvider extends CollectionProvider {
    imports?: Array<ModuleImportType>;
    providers?: Array<ProviderType>;
  }

  export interface InjectableOptions {
    imports?: Array<ModuleImportType>;
    providers?: Array<ProviderType>;
  }

  export interface ProviderAnnotations {
    enhancerTokens?: {
      interceptor?: ProviderToken;
      guard?: ProviderToken;
      exceptionHandler?: ProviderToken;
      pipe?: ProviderToken;
    }
  }
}
