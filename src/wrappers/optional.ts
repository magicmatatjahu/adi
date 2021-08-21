import { WrapperDef } from "../interfaces";
import { NilInjectorError } from "../errors";
import { createWrapper } from "../utils";

function wrapper(defaultValue?: any): WrapperDef {
  return (injector, session, next) => {
    // return thenable(next)(injector, session).then(
    //   val => val,
    //   err => {
    //     if ((err as NilInjectorError).isNilInjectorError) return defaultValue;
    //     throw err;
    //   }
    // );
    try {
      return next(injector, session);
    } catch(err) {
      if ((err as NilInjectorError).isNilInjectorError) return defaultValue;
      throw err;
    }
  }
}

export const Optional = createWrapper<any, false>(wrapper);
