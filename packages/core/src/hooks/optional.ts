import { createHook } from "./hook";
import { NilInjectorError } from "../problem";
import { wait } from "../utils";

export const Optional = createHook((defaultValue?: any) => {
  return (session, next) => {
    return wait(
      () => next(session),
      val => val,
      err => {
        if (err instanceof NilInjectorError) {
          return defaultValue;
        }
        throw err;
      }
    );
  }
}, { name: 'adi:hook:optional' })
