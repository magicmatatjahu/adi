import type { Injector } from '../injector/injector';
import type { Session } from '../injector/session';
import type { InjectionHook } from './hook';
import type { InjectionArgument, InjectionArguments, InjectionItem, InjectionMetadata } from './injection';
import type { ConstraintDefinition, ProviderHookAnnotations } from './provider';
import type { ProviderToken } from './provider-token';
import type { ClassType } from './types';

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

export type CustomResolver<R = any> = (session: Session, ...args: any[]) => R | Promise<R>;

export type CustomResolverOptions<T = any> = 
  { kind: 'function', handler: (...args: any[]) => T | Promise<T>, inject?: InjectionItem[], metadata?: Partial<InjectionMetadata> } |
  { kind: 'class', class: ClassType<T>, asStandalone?: boolean, metadata?: Partial<InjectionMetadata> } |
  { kind: 'injection-item', item: InjectionItem, metadata?: Partial<InjectionMetadata> } |
  { kind: 'value', value: any }

