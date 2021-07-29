import { Injector, NilInjector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(_: never): WrapperDef {
  // console.log('self');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside self');
    const token = session.options.token;
    // check for treeshakable provider
    (injector as any).getRecord(token);
    
    if ((injector as any).records.has(token)) {
      return next(injector, session);
    }
    // if token is not found
    return next(NilInjector, session);
  }
}

export const Self = createWrapper(wrapper);
