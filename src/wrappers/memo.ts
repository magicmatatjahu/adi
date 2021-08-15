import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";
import { createWrapper as cr } from "../utils/wrappers.new";

function wrapper(): WrapperDef {
  return (injector, session, next) => {
    const value = next(injector, session);
    session.setSideEffect(false);
    return value;
  }
}

export const NewMemo = cr<undefined, false>(wrapper);
export const Memo = createWrapper(wrapper);