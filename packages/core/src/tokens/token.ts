import type { InjectionToken } from '../tokens';
import type { ProviderToken } from '../types';

export function token<T>(inferToken: ProviderToken): InjectionToken<T> {
  return inferToken as InjectionToken<T>
}
