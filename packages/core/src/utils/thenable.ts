import { isPromiseLike } from "./guards";

const noopThen = <T>(value: T) => { return value; }
const noopCatch = (err: unknown) => { throw err; }

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
