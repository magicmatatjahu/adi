function isPromiseLike<T>(maybePromise: any): maybePromise is PromiseLike<T> {
  return maybePromise && typeof maybePromise.then === 'function';
}

const noopThen = <T>(value: T) => { return value; }
const noopCatch = (err: unknown) => { throw err; }

// TODO: Fix type
export function thenable<T>(
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

export function thenableAll(maybePromises: any[]) {
  if (maybePromises.some(isPromiseLike)) {
    return Promise.all(maybePromises);
  }
  return maybePromises;
}