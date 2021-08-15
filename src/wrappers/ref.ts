import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils";
import { createWrapper as cr } from "../utils/wrappers.new";

function wrapper(ref: () => Token): WrapperDef {
  return (injector, session, next) => {
    session.setToken(ref());
    return next(injector, session);
  }
}

export const NewRef = cr<() => Token, true>(wrapper);
export const Ref = createWrapper(wrapper);
