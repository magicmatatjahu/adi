import { WrapperDef } from "../interfaces";
import { NilInjectorError } from "../errors";
import { createWrapper } from "../utils";
import { createWrapper as cr } from "../utils/wrappers.new";

function wrapper(defaultValue?: any): WrapperDef {
  return (injector, session, next) => {
    try {
      return next(injector, session);
    } catch(err) {
      if ((err as NilInjectorError).isNilInjectorError) return defaultValue;
      throw err;
    }
  }
}

export const NewOptional = cr<any, false>(wrapper);
export const Optional = createWrapper(wrapper);
