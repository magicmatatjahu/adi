import { WrapperDef } from "../interfaces";
import { createWrapper, hasOnDestroyHook } from "../utils";

function wrapper(): WrapperDef {
  return (injector, session, next) => {
    const value = next(injector, session);
    if (hasOnDestroyHook(value)) {
      value.onDestroy();
    }
    return value;
  }
}

export const OnDestroyHook = createWrapper<undefined, false>(wrapper);
