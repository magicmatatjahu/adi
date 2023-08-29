import type { ForwardReference } from '../types/forward-reference';

export function ref<T>(fn: () => T): ForwardReference<T> {
  return {
    ref: fn,
    _$ref: ref,
  };
}

export function isForwardRef<T = any>(type: unknown): type is ForwardReference<T> {
  return type! && (type as ForwardReference<T>)._$ref === ref;
}

export function resolveRef<T>(type: T): Exclude<T, ForwardReference<T>> {
  return isForwardRef(type) ? resolveRef(type.ref()) : type;
}
