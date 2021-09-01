import { ForwardRef } from '../interfaces';

// ForwardRef
export function ref<T>(fn: () => T): ForwardRef<T> {
  return {
    ref: fn,
    _$ref: ref,
  };
}

export function isForwardRef(type: unknown): type is ForwardRef {
  return type && (type as ForwardRef)._$ref === ref;
}

export function resolveRef<T>(type: T): T {
  return isForwardRef(type) ? type.ref() : type;
}