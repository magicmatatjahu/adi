import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";
import { createWrapper as cr } from "../utils/wrappers.new";

function wrapper(): WrapperDef {
  return (injector, session, next) => {
    const value = next(injector, session);
    session.setSideEffect(true);
    return value;
  }
}

export const NewSideEffects = cr<undefined, false>(wrapper);
export const SideEffects = createWrapper(wrapper);