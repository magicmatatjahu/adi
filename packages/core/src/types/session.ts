import type { Injector } from '../injector/injector'
import type { InjectionMetadata, InjectionOptions } from './injection'
import type { ProviderRecord, ProviderDefinition, ProviderInstance } from './provider-record'

export interface SessionInjection<T = any> {
  inject: InjectionOptions<T>;
  readonly metadata: InjectionMetadata,
}

export interface SessionContext<T = any> {
  injector: Injector;
  provider?: ProviderRecord;
  definition?: ProviderDefinition<T>;
  instance?: ProviderInstance<T>;
}

export interface SessionAnnotations {
  [key: string | symbol]: any;
}
