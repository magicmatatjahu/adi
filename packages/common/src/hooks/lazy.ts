import { createHook, wait } from '@adi/core';

export type LazyType<T = any> = () => T;

export const Lazy = createHook(() => {
  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    let value: any, resolved = false;
    return () => {
      if (resolved === false) {
        resolved = true;
        return value = wait(
          next(session),
          v => value = v,
        );
      }
      return value;
    };
  }
}, { name: 'adi:hook:lazy' });
