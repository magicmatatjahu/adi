import { isPromiseLike } from "./guards";

export function promiseLikify<T = any>(fn: (...args: any[]) => T | Promise<T>): (...args: any[]) => PromiseLike<T> {
  return (...args: any[]) => {
    const result = fn(...args);
    if (isPromiseLike(result)) {
      return result;
    }
    return {
      then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null): PromiseLike<TResult1 | TResult2> {
        if (typeof onfulfilled === 'function') {
          return onfulfilled(result) as PromiseLike<TResult1 | TResult2>;
        }
        return onfulfilled;
      }
    }
  }
}
