import type { ProviderToken, InjectionHook, ConstraintDefinition, ProviderAnnotations, ScopeType, ClassType, AbstractClassType, ModuleImportType, ProviderType, CustomProvider } from '@adi/core';
import type { ExecutionContext } from './enhancers';

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

export interface RegistryProvider extends CustomProvider {
  imports?: Array<ModuleImportType>;
  providers?: Array<ProviderType>;
  useRegistry: ClassType | AbstractClassType;
}

declare module '@adi/core' {
  export interface TokenProvider {
    imports?: Array<ModuleImportType>;
    providers?: Array<ProviderType>;
    useRegistry?: never;
  }

  export interface ClassProvider {
    imports?: Array<ModuleImportType>;
    providers?: Array<ProviderType>;
    useRegistry?: never;
  }

  export interface FactoryProvider {
    imports?: Array<ModuleImportType>;
    providers?: Array<ProviderType>;
    useRegistry?: never;
  }

  export interface ClassicProvider {
    imports?: Array<ModuleImportType>;
    providers?: Array<ProviderType>;
    useRegistry?: never;
  }

  export interface ValueProvider {
    imports?: never;
    providers?: never;
    useRegistry?: never;
  }

  export interface ExistingProvider {
    imports?: never;
    providers?: never;
    useRegistry?: never;
  }

  export interface HookProvider {
    imports?: never;
    providers?: never;
    useRegistry?: never;
  }

  export interface ProviderTypesRegistry<T> {
    registry: RegistryProvider;
  }

  export interface InjectableOptions {
    imports?: Array<ModuleImportType>;
    providers?: Array<ProviderType>;
  }

  export interface DefinitionAnnotations {
    enhancers?: {
      guardCallback?: (ctx: ExecutionContext) => unknown,
      tokens?: {
        interceptor?: ProviderToken;
        guard?: ProviderToken;
        exceptionHandler?: ProviderToken;
        pipe?: ProviderToken;
      }
    }
  }
}
