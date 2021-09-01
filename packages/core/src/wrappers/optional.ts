import { WrapperDef } from "../interfaces";
import { NilInjectorError } from "../errors";
import { createWrapper, thenable } from "../utils";

function wrapper(defaultValue?: any): WrapperDef {
  return (injector, session, next) => {
    return thenable(
      () => next(injector, session),
      val => val,
      err => {
        if ((err as NilInjectorError).isNilInjectorError) return defaultValue;
        throw err;
      }
    );
  }
}

export const Optional = createWrapper<any, false>(wrapper);
