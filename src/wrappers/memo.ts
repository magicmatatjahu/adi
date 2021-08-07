import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(_: never): WrapperDef {
  return (injector, session, next) => {
    const value = next(injector, session);
    session.setSideEffect(false);
    return value;
  }
}

export const Memo = createWrapper(wrapper);