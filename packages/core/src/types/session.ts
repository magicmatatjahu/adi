import type { Injector } from '../injector';
import type { InjectionMetadata, InjectionAnnotations } from './injection'
import type { ProviderToken } from './provider-token'

export interface SessionInput {
  injector: Injector;
  token: ProviderToken | undefined;
  annotations: InjectionAnnotations;
  metadata: InjectionMetadata;
}

export interface SessionData {
  [key: string | symbol]: any;
}
