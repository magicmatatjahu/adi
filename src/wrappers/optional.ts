import { Injector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(defaultValue?: any): WrapperDef {
  // console.log('optional');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside optional');
    try {
      return next(injector, session);
    } catch(err) {
      if ((err as any).NilInjectorError === true) return defaultValue;
      throw err;
    }
  }
}

export const Optional = createWrapper(wrapper);
