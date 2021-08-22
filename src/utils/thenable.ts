import { isPromiseLike } from "./guards";

export function thenable<T>(fn: (...args: any[]) => T | Promise<T>): (...args: any[]) => PromiseLike<T> {
  return (...args: any[]) => {
    let result: T | Promise<T>, error: Error | undefined;
    try {
      result = fn(...args);
    } catch(err) {
      // it's needed only in sync resolution
      error = err;
    }

    if (isPromiseLike(result)) {
      return result as PromiseLike<T>;
    }

    return {
      then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
      ): PromiseLike<TResult1 | TResult2> {
        if (error !== undefined) {
          if (typeof onrejected === 'function') {
            return onrejected(error) as PromiseLike<TResult1 | TResult2>;
          } else {
            throw error;
          }
        }
        try {
          if (typeof onfulfilled === 'function') {
            return onfulfilled(result as T) as PromiseLike<TResult1 | TResult2>;
          }
          return onfulfilled;
        } catch(err) {
          if (typeof onrejected === 'function') {
            return onrejected(err) as PromiseLike<TResult1 | TResult2>;
          } else {
            throw err;
          }
        }
      }
    }
  }
}
