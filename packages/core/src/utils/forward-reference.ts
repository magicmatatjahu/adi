import type { ForwardReference } from '../interfaces';

export function dynamic<T>(fn: () => Promise<T>): ForwardReference<Promise<T>> {
  return {
    ref: fn,
    _$ref: ref,
  };
}

export function ref<T>(fn: () => T): ForwardReference<T> {
  return {
    ref: fn,
    _$ref: ref,
  };
}

export function isForwardRef(type: unknown): type is ForwardReference {
  return type && (type as ForwardReference)._$ref === ref;
}

export function resolveRef<T>(type: T): Exclude<T, ForwardReference<T>> {
  return isForwardRef(type) ? resolveRef(type.ref()) : type;
}