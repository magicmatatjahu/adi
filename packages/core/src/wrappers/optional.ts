import { NilInjectorError } from "../errors";
import { createWrapper, thenable } from "../utils";

export const Optional = createWrapper((defaultValue?: any) => {
  return (session, next) => {
    return thenable(
      () => next(session),
      val => val,
      err => {
        if ((err as NilInjectorError).isNilInjectorError) return defaultValue;
        throw err;
      }
    );
  }
}, { name: 'Optional' });
