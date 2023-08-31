import type { ModuleToken } from '../tokens/module.token'; 
import type { ExtendedModule, ModuleMetadata } from './module';
import type { ProviderType } from './provider';
import type { ClassType } from './types';

export type InjectorInput<T = any> = ClassType<T> | ModuleToken | ModuleMetadata | Array<ProviderType> | ExtendedModule<T>;

export type InjectorScope<T = any> = 'any' | string | symbol | InjectorInput<T>;

export interface InjectorOptions {
  name?: string;
  annotations?: InjectorAnnotations;
  scopes?: Array<InjectorScope<any>>;
  importing?: boolean;
  exporting?: boolean;
  initialize?: boolean;
}

export interface InjectorAnnotations {
  [key: string | symbol]: any;
}