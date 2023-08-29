export function createArray<T>(value: T | Array<T>): Array<Exclude<T, undefined>> {
  if (Array.isArray(value)) {
    return value as any;
  }
  return value ? [value] : [] as any;
}
