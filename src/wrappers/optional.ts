import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(defaultValue?: any): WrapperDef {
  return (injector, session, next) => {
    try {
      return next(injector, session);
    } catch(err) {
      if ((err as any).NilInjectorError === true) return defaultValue;
      throw err;
    }
  }
}

export const Optional = createWrapper(wrapper);
