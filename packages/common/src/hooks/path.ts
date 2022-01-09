import { createWrapper, SessionStatus } from '@adi/core';
import { thenable } from '@adi/core/lib/utils';

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
  let index = 0
  const length = path.length

  while (value != null && index < length) {
    value = value[toKey(path[index++])];
  }
  return (index && index == length) ? value : undefined;
}

export const Path = createWrapper((path: string) => {
  const props = path.split('.').filter(Boolean);
  
  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }

    return thenable(
      () => next(session),
      value => getValue(value, props),
    );
  }
}, { name: 'Path' });