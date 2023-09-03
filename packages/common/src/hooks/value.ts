import { Hook, wait } from '@adi/core';

import type { Session, InjectionHookResult, NextInjectionHook } from '@adi/core';

// copy from lodash
const INFINITY = 1 / 0;
function toKey(value: any) {
  const typeOf = typeof value;
  if (typeOf === 'string' || typeOf === 'symbol') {
    return value;
  }
  const result = `${value}`;
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

function getValue(value: object, path: string[]) {
  let index = 0;
  const length = path.length;

  while (value != null && index < length) {
    value = value[toKey(path[index++])];
  }
  return index == length ? value : undefined;
}

export function Value<NextValue>(path: string = '') {
  const props = path.split('.').filter(Boolean);
  
  return Hook(
    function valueHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue | object | undefined> {
      if (session.hasFlag('dry-run')) {
        return next(session);
      }
  
      return wait(
        next(session),
        value => getValue(value as any, props),
      );
    },
    { name: 'adi:value' }
  )
}
