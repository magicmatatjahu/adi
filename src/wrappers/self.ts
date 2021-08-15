import { NilInjector } from "../injector";
import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(): WrapperDef {
  return (injector, session, next) => {
    const token = session.getToken();
    // check for treeshakable provider
    (injector as any).getRecord(token);
    
    if ((injector as any).records.has(token)) {
      return next(injector, session);
    }
    // if token is not found
    return next(NilInjector, session);
  }
}

export const Self = createWrapper<undefined, false>(wrapper);
// export const Self = createWrapper(wrapper);
