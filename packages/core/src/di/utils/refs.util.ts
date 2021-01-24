import { ForwardRef } from '../interfaces';

// ForwardRef
export function forwardRef<T>(fn: () => T): ForwardRef<T> {
  return {
    ref: fn,
    _$ref: forwardRef,
  };
}

export function isForwardRef(type: unknown): type is ForwardRef {
  return type && (type as ForwardRef)._$ref === forwardRef;
}

export function resolveForwardRef<T>(type: T): T {
  return isForwardRef(type) ? type.ref() : type;
}
