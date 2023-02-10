import type { ProviderToken, SimplifiedProvider, ClassType, AbstractClassType, InjectionItem, Injections, InjectionHook, ConstraintDefinition, ProviderAnnotations, ScopeType, ModuleImportType, ProviderType } from '@adi/core';

export type ProvidesOptions<T = any> = { provide: ProviderToken<T> } & SimplifiedProvider<T>;

export interface ProvideDefinition {
  prototype: Record<string | symbol, ProvidesOptions>;
  static: Record<string | symbol, ProvidesOptions>;
}

export interface Provider<T = any> {
  provide(): T | Promise<T>;
}

export interface ClassicProvider<T = any> {
  provide: ProviderToken<T>;
  useProvider: Provider<T> | ClassType<Provider<T>> | ClassType | AbstractClassType;
  inject?: Array<InjectionItem | undefined> | Injections;
  hooks?: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;
  scope?: ScopeType;
  imports?: Array<ModuleImportType>;
  providers?: Array<ProviderType | ClassicProvider>;

  useClass?: never;
  useFactory?: never;
  useValue?: never;
  useExisting?: never;
}

declare module '@adi/core' {
  export interface ClassProvider {
    imports?: Array<ModuleImportType>;
    providers?: Array<ProviderType | ClassicProvider>;
    useProvider?: never;
  }

  export interface FactoryProvider {
    imports?: Array<ModuleImportType>;
    providers?: Array<ProviderType | ClassicProvider>;
    useProvider?: never;
  }

  export interface ValueProvider {
    useProvider?: never;
    imports?: never;
    providers?: never;
  }

  export interface ExistingProvider {
    useProvider?: never;
    imports?: never;
    providers?: never;
  }

  export interface HookProvider {
    useProvider?: never;
    imports?: never;
    providers?: never;
  }

  export interface ExtraProvider extends ClassicProvider {}
}
