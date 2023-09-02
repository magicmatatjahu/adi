import type { InjectionToken } from '../tokens/injection.token'
import type { ClassType, AbstractClassType } from './types'

export interface ProviderTokenRegistry {
  [token: string | symbol]: unknown;
}

export type ProviderToken<T = any> = ClassType<T> | AbstractClassType<T> | InjectionToken<T> | string | symbol;

export type InferredProviderTokenType<T> = 
  T extends string ? ProviderTokenRegistry[T] :
  T extends symbol ? ProviderTokenRegistry[T] :
  T extends ProviderToken<infer R> ? R :
  unknown
