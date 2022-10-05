function isPromiseLike<T>(maybePromise: any): maybePromise is PromiseLike<T> {
  return maybePromise && typeof maybePromise.then === 'function';
}

export const noopThen = <T>(value: T) => { return value; }
export const noopCatch = (err: unknown) => { throw err; }

export function wait<T>(
  result: T,
  thenAction: (value: Exclude<T, PromiseLike<T>>) => T | never = noopThen,
  catchAction: (err: unknown) => T | never = noopCatch,
) {
  if (isPromiseLike(result)) {
    return result.then(thenAction, catchAction);
  }
  return thenAction(result as any);
}

export function waitCallback<T>(
  action: () => T,
  thenAction: (value: Exclude<T, PromiseLike<T>>) => T | never = noopThen,
  catchAction: (err: unknown) => T | never = noopCatch,
) {
  let result: T | never;
  try {
    result = action();
  } catch(err) {
    result = catchAction(err);
  }
  if (isPromiseLike(result)) {
    return result.then(thenAction, catchAction);
  }
  return thenAction(result as any);
}

export function waitAll<T>(
  maybePromises: Array<T | Promise<T>>,
  thenAction?: (value: Exclude<T[], PromiseLike<T[]>>) => T | never,
  catchAction: (err: unknown) => T | never = noopCatch,
) {
  let result: any = maybePromises;
  if (maybePromises.some(isPromiseLike)) {
    result = Promise.all(maybePromises);
  }
  return wait(result, thenAction, catchAction);
}

// TODO: return all performed data
export function waitSequence<T>(
  data: T[],
  action: (data: T) => any,
  thenAction: (value: Array<any>) => any | never = noopThen as any,
  catchAction: (err: unknown) => T | never = noopCatch,
) {
  if (data.length === 0) return thenAction([]);
  return _waitSequence(data, action, thenAction, catchAction, [], -1);
}

function _waitSequence<T>(
  data: T[],
  action: (data: T) => any,
  thenAction: (value: Array<any>) => any | never = noopThen as any,
  catchAction: (err: unknown) => T | never = noopCatch,
  resolvedData: Array<any> = [],
  idx: number = -1,
) {
  if (++idx === data.length) return thenAction(resolvedData);
  return wait(
    action(data[idx]),
    () => _waitSequence(data, action, thenAction, catchAction, resolvedData, idx),
    catchAction,
  )
}