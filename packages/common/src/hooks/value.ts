import { createHook, SessionFlag, wait } from '@adi/core';

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

export const Value = createHook((path: string = '') => {
  const props = path.split('.').filter(Boolean);
  
  return (session, next) => {
    if (session.hasFlag(SessionFlag.DRY_RUN)) {
      return next(session);
    }

    return wait(
      next(session),
      value => getValue(value, props),
    );
  }
}, { name: 'adi:hook:value' });