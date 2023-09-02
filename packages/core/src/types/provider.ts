import type { InjectionToken } from '../tokens/injection.token'
import type { Session } from '../injector/session'
import type { ProviderToken } from './provider-token'
import type { Injections, InjectionItem } from './injection';
import type { InjectorScope } from './injector';
import type { InjectionHook } from './hook';
import type { ScopeType } from './scope';
import type { ClassType } from './types'

export type ProviderType<T = any> = 
  | ClassTypeProvider<T>
  | InjectionToken<T>
  | TokenProvider<T>
  | ClassProvider<T>
  | FactoryProvider<T>
  | ClassFactoryProvider<T>
  | ValueProvider<T>
  | ExistingProvider<T>
  | HookProvider<T>
  | CustomProvider<T>;

export type ObjectProvider<T = any> = 
  | ClassProvider<T>
  | FactoryProvider<T>
  | ClassFactoryProvider<T>
  | ValueProvider<T>
  | ExistingProvider<T>
  | CustomProvider<T>;

export type OverwriteProvider<T = any> = 
  | Omit<ClassProvider<T>, 'provide'> 
  | Omit<FactoryProvider<T>, 'provide'> 
  | Omit<ClassFactoryProvider<T>, 'provide'> 
  | Omit<ValueProvider<T>, 'provide'>
  | Omit<ExistingProvider<T>, 'provide'>
  | Omit<CustomProvider<T>, 'provide'>;

export interface ClassTypeProvider<T = any> extends ClassType<T> {}

export interface TokenProvider<T = any> {
  provide: ProviderToken<T>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;

  name?: never;
  hooks?: never;
  useClass?: never;
  useFactory?: never;
  useValue?: never;
  useExisting?: never;
  inject?: never;
  scope?: never;
}

export interface ClassProvider<T = any> {
  provide: ProviderToken<T>;
  useClass: ClassType<T>;
  name?: string | symbol | object;
  inject?: Array<InjectionItem | undefined> | Injections;
  hooks?: ProviderHooks;
  when?: ConstraintDefinition;
  annotations?: ProviderDefinitionAnnotations;
  scope?: ScopeType;

  useFactory?: never;
  useValue?: never;
  useExisting?: never;
}

export interface FactoryProvider<T = any> {
  provide: ProviderToken<T>;
  useFactory: (...args: any[]) => T | Promise<T>;
  name?: string | symbol | object;
  inject?: Array<InjectionItem>;
  hooks?: ProviderHooks;
  when?: ConstraintDefinition;
  annotations?: ProviderDefinitionAnnotations;
  scope?: ScopeType;

  useClass?: never;
  useValue?: never;
  useExisting?: never;
}

export interface ClassFactoryProvider<T = any> {
  provide: ProviderToken<T>;
  useFactory: ClassType<Provide>;
  name?: string | symbol | object;
  inject?: Array<InjectionItem | undefined> | Injections;
  hooks?: ProviderHooks;
  when?: ConstraintDefinition;
  annotations?: ProviderDefinitionAnnotations;
  scope?: ScopeType;

  useClass?: never;
  useValue?: never;
  useExisting?: never;
}

export interface ValueProvider<T = any> {
  provide: ProviderToken<T>;
  useValue: T;
  name?: string | symbol | object;
  hooks?: ProviderHooks;
  when?: ConstraintDefinition;
  annotations?: ProviderDefinitionAnnotations;

  useClass?: never;
  useFactory?: never;
  useExisting?: never;
  inject?: never;
  scope?: never;
}

export interface ExistingProvider<T = any> {
  provide: ProviderToken<T>;
  useExisting: ProviderToken<any>;
  name?: string | symbol | object;
  hooks?: ProviderHooks;
  when?: ConstraintDefinition;
  annotations?: ProviderDefinitionAnnotations;

  useClass?: never;
  useFactory?: never;
  useValue?: never;
  inject?: never;
  scope?: never;
}

export interface CustomProvider<T = any> {
  provide?: ProviderToken<T>;
  name?: string | symbol | object;
  hooks?: ProviderHooks;
  when?: ConstraintDefinition;
  annotations?: ProviderDefinitionAnnotations;

  useClass?: never;
  useFactory?: never;
  useValue?: never;
  useExisting?: never;
}

export interface HookProvider<T = any> {
  provide?: ProviderToken<T>;
  hooks: ProviderHooks;
  name?: string | symbol | object;
  when?: ConstraintDefinition;
  annotations?: ProviderHookAnnotations;

  useClass?: never;
  useFactory?: never;
  useValue?: never;
  useExisting?: never;
  inject?: never;
  scope?: never;
}

export interface InjectionTokenOptions<T = any> {
  provideIn?: InjectorScope | Array<InjectorScope>;
  provide?: OverwriteProvider<T>;
  inject?: InjectionItem<T>;
}

export interface Provide<T = any> {
  provide(...args: []): T | Promise<T>;
}

export type ConstraintDefinition = (session: Session) => boolean;

export type ProviderHooks = InjectionHook<any, any> | Array<InjectionHook<any, any>>;

export interface ProviderAnnotations {
  tags?: Array<string | symbol | object>;
  visible?: 'public' | 'private';
  eager?: boolean;
  aliases?: Array<ProviderToken<any>>;
  component?: boolean;
  [key: string | symbol]: any;
}

export interface ProviderDefinitionAnnotations {
  name?: string | symbol | object;
  tags?: Array<string | symbol | object>;
  order?: number;
  visible?: 'public' | 'private';
  eager?: boolean;
  aliases?: Array<ProviderToken<any>>;
  config?: ProviderToken<any> | object;
  component?: boolean;
  [key: string | symbol]: any;
}

export interface ProviderHookAnnotations {
  name?: string | symbol | object;
  order?: number;
  visible?: 'public' | 'private';
  [key: string | symbol]: any;
}