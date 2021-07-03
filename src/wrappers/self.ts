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
    const ownRecord = (injector as any).records.get(token);
    // if token is not found
    if (ownRecord === undefined) {
      return next(NilInjector, session);
    }
    return next(injector, session);
  }
}

export const Self = createWrapper(wrapper);
