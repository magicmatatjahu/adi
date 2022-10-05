import { createHook } from "./hook";
import { NilInjectorError } from "../problem";
import { waitCallback } from "../utils";

export const Optional = createHook((defaultValue?: any) => {
  return (session, next) => {
    return waitCallback(
      () => next(session),
      undefined,
      err => {
        if (err instanceof NilInjectorError) {
          return defaultValue;
        }
        throw err;
      }
    );
  }
}, { name: 'adi:hook:optional' })
