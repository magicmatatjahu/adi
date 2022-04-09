import { createHook } from "./hook";
import { thenable } from "../utils";

// import type { InjectionHook } from "../interfaces";

export const Optional = createHook((defaultValue?: any) => {
  return (session, next) => {
    return thenable(
      () => next(session),
      val => val,
      err => {
        // if (err instanceof NilInjectorError) return defaultValue;
        throw err;
      }
    );
  }
}, { name: 'adi:hook:optional' })


// function lol<T>(type: T, lol: InjectionHook<T>): T {
//   return;
// }

// lol<string>('lol', Optional())
