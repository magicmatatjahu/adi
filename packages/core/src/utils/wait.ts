const ADI_PROMISE_DEF = Symbol('adi:definition:promise');

export function patchPromise(promise: any = Promise): void {
  promise.prototype[ADI_PROMISE_DEF] = ADI_PROMISE_DEF; 
}

export function isPromiseLike<T>(maybePromise: unknown): maybePromise is Promise<T> {
  return maybePromise! && maybePromise[ADI_PROMISE_DEF] === ADI_PROMISE_DEF;
}

export const noopThen = (value: any) => value;
export const noopCatch = (err: unknown) => { throw err; }
export const noopFinally = () => void 0;

export function wait<T, R>(
  maybePromise: T,
  thenAction: (value: Awaited<T>) => R | Promise<R>,
): R | Promise<R>;
export function wait<T, R, C>(
  maybePromise: T,
  thenAction: (value: Awaited<T>) => R | Promise<R>,
  catchAction: (err: unknown) => C | Promise<C> | never,
): R | Promise<R> | C | Promise<C> | never;
export function wait<T, R, C>(
  maybePromise: T,
  thenAction: (value: Awaited<T>) => R | Promise<R> = noopThen,
  catchAction: (err: unknown) => C | Promise<C> | never = noopCatch,
): R | Promise<R> | C | Promise<C> | never {
  if (isPromiseLike(maybePromise)) {
    return maybePromise.then(thenAction as (value: unknown) => R | Promise<R>, catchAction) as R | Promise<R> | C | Promise<C> | never
  }
  return thenAction(maybePromise as any) as R | Promise<R>;
}

export function waitCallback<T, R>(
  result: () => T,
  thenAction: (value: Awaited<T>) => R | Promise<R>,
): R | Promise<R>;
export function waitCallback<T, R, C>(
  result: () => T,
  thenAction: (value: Awaited<T>) => R | Promise<R>,
  catchAction: (err: unknown) => C | Promise<C> | never,
): R | Promise<R> | C | Promise<C> | never;
export function waitCallback<T, R, C>(
  result: () => T,
  thenAction: (value: Awaited<T>) => R | Promise<R>,
  catchAction: (err: unknown) => C | Promise<C> | never,
  finallyAction: () => void,
): R | Promise<R> | C | Promise<C> | never;
export function waitCallback<T, R, C>(
  action: () => T,
  thenAction: (value: Awaited<T>) => R | Promise<R> = noopThen,
  catchAction: (err: unknown) => C | Promise<C> | never = noopCatch,
  finallyAction: () => void = noopFinally,
): R | Promise<R> | C | Promise<C> | never {
  let result: T | never;
  try {
    result = action();
  } catch(err: unknown) {
    result = catchAction(err) as any;
  }

  if (isPromiseLike(result)) {
    return result.then(thenAction as (value: unknown) => R | Promise<R>, catchAction).finally(finallyAction) as R | Promise<R> | C | Promise<C> | never;
  }

  try {
    return thenAction(result as any) as R | Promise<R>;
  } catch(err: unknown) {
    return catchAction(err) as any
  } finally {
    finallyAction();
  }
}

export function waitAll<T, R>(
  maybePromises: Array<T | Promise<T>>,
  thenAction?: (value: Awaited<T[]>) => R | Promise<R> | never,
): R | Promise<R>;
export function waitAll<T, R, C>(
  maybePromises: Array<T | Promise<T>>,
  thenAction?: (value: Awaited<T[]>) => R | Promise<R> | never,
  catchAction?: (err: unknown) => C | Promise<C> | never,
): R | Promise<R> | C | Promise<C> | never;
export function waitAll<T, R, C>(
  maybePromises: Array<T | Promise<T>>,
  thenAction?: (value: Awaited<T[]>) => T | never,
  catchAction: (err: unknown) => T | never = noopCatch,
): R | Promise<R> | C | Promise<C> | never {
  let result: any = maybePromises;
  if (maybePromises.some(isPromiseLike)) {
    result = Promise.all(maybePromises);
  }
  return wait(result, thenAction as (value: unknown) => R | Promise<R>, catchAction) as R | Promise<R> | C | Promise<C> | never;
}

export function waitSequence<T, D, R>(
  data: T[],
  action: (data: T, index: number, array: T[]) => D | Promise<D>,
): D | Promise<D>;
export function waitSequence<T, D, R>(
  data: T[],
  action: (data: T, index: number, array: T[]) => D | Promise<D>,
  thenAction: (value: Array<D>) => R | Promise<R>,
): R | Promise<R>;
export function waitSequence<T, D, R, C>(
  data: T[],
  action: (data: T, index: number, array: T[]) => D | Promise<D>,
  thenAction: (value: Array<D>) => R | Promise<R>,
  catchAction: (err: unknown) => C | Promise<C> | never,
): R | Promise<R> | C | Promise<C> | never;
export function waitSequence<T, D, R, C>(
  data: T[] = [],
  action: (data: T, index: number, array: T[]) => D | Promise<D>,
  thenAction: (value: Array<D>) => R | Promise<R> = noopThen,
  catchAction: (err: unknown) => C | Promise<C> | never = noopCatch,
): R | Promise<R> | C | Promise<C> | never {
  if (!data.length) return thenAction([]);
  return _waitSequence(data, action, thenAction, catchAction, [], -1);
}

function _waitSequence<T, D, R, C>(
  data: T[],
  action: (data: T, index: number, array: T[]) => D | Promise<D>,
  thenAction: (value: Array<D>) => R | Promise<R>,
  catchAction: (err: unknown) => C | Promise<C> | never,
  resolvedData: Array<any>,
  idx: number,
) {
  if (++idx === data.length) return thenAction(resolvedData);
  return wait(
    action(data[idx], idx, data),
    result => (resolvedData.push(result), _waitSequence(data, action, thenAction, catchAction, resolvedData, idx)),
    catchAction,
  )
}