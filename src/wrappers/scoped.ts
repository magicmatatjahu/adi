import { WrapperDef } from "../interfaces";
import { Scope } from "../scope";
import { createWrapper } from "../utils";

function wrapper(scope: Scope): WrapperDef {
  return (injector, session, next) => {
    session.setScope(scope);
    return next(injector, session);
  }
}

export const Scoped = createWrapper(wrapper);
