import type { Context } from '../injector/context';
import type { Injector } from '../injector/injector';
import type { Session } from '../injector/session';
import type { InjectionHook } from './hook';
import type { InjectionArgument, InjectionArguments } from './injection';
import type { ProviderToken } from './provider-token';
import type { ProviderType, ConstraintDefinition, ProviderAnnotations, ProviderDefinitionAnnotations, ProviderHookAnnotations } from './provider';
import type { ScopeType } from './scope';
import type { ClassType } from './types';
import type { ProviderKind, InstanceStatus } from '../enums';

export interface ProviderRecord<T = any> {
  token: ProviderToken<T>;
  host: Injector;
  when?: ConstraintDefinition;
  hooks: Array<InjectionHookRecord>;
  defs: ProviderDefinition[];
  annotations: ProviderAnnotations;
  meta: ProviderDefinitionMetadata;
}

export interface ProviderDefinition<T = any> {
  provider: ProviderRecord<T>;
  original: ProviderType,
  name: string | symbol | object | undefined;
  kind: ProviderKind;
  factory: FactoryDefinition,
  scope: ScopeType;
  when: ConstraintDefinition | undefined;
  hooks: Array<InjectionHook<any, any>>;
  annotations: ProviderDefinitionAnnotations;
  values: Map<Context, ProviderInstance<T>>;
  default: boolean;
  meta: ProviderRecordMetadata;
}

export interface ProviderInstance<T = any> {
  definition: ProviderDefinition;
  context: Context,
  value: T;
  status: InstanceStatus;
  scope: ScopeType;
  session: Session;
  parents?: Set<ProviderInstance>;
  links?: Set<ProviderInstance>;
  meta: ProviderInstanceMetadata;
}

export interface InjectionHookRecord {
  kind: 'injector' | 'provider';
  hook: InjectionHook<any, any>;
  when: ConstraintDefinition;
  annotations: ProviderHookAnnotations;
  meta: InjectionHookRecordMetadata;
}

export interface ProviderRecordMetadata {
  [key: string | symbol]: any;
}

export interface ProviderDefinitionMetadata {
  [key: string | symbol]: any;
}

export interface ProviderInstanceMetadata {
  [key: string | symbol]: any;
}

export interface InjectionHookRecordMetadata {
  [key: string | symbol]: any;
}

export interface FactoryDefinition<T = any, D = any> {
  resolver: FactoryResolver<T, D>;
  data: D;
}

export type FactoryResolver<R = any, D = any> = (injector: Injector, session: Session, data: D) => R | Promise<R>;

export type FactoryDefinitionClass<T = any> = FactoryDefinition<T, { class: ClassType<T>, inject: InjectionArguments }>;
export type FactoryDefinitionFactory<T = any> = FactoryDefinition<T, { factory: (...args: any[]) => T | Promise<T>, inject: Array<InjectionArgument> }>;
export type FactoryDefinitionValue<T = any> = FactoryDefinition<T, T>;
