import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(): WrapperDef {
  return (injector, session, next) => {
    const value = next(injector, session);
    session.setSideEffect(true);
    return value;
  }
}

export const SideEffects = createWrapper<undefined, false>(wrapper);
// export const SideEffects = createWrapper(wrapper);