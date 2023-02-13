import type { InjectionItem } from '@adi/core';

export function hasInjections(value: unknown): value is { inject: Array<InjectionItem> } {
  return value && Boolean((value as { inject: Array<InjectionItem> }).inject);
}
