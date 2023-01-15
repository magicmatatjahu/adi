const INFINITY = 1 / 0;
function toKey(value: any) {
  const typeOf = typeof value;
  if (typeOf === 'string' || typeOf === 'symbol') {
    return value;
  }
  const result = `${value}`;
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

export function getDeepProperty(value: object, path: string | string[]) {
  if (!Array.isArray(path)) {
    path = path.split('.').filter(Boolean);
  }

  let index = 0;
  const length = path.length;

  while (value != null && index < length) {
    value = value[toKey(path[index++])];
  }
  return index == length ? value : undefined;
}
