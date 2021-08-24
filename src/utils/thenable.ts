import { isPromiseLike } from "./guards";

const noopError = (err: unknown) => { throw err; }

export function thenable<T>(
  action: () => T,
  thenAction: (value: T) => T | never,
  catchAction: (err: unknown) => T | never = noopError,
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
  return thenAction(result);
}
