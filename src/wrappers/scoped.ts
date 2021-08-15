import { ScopeShape, ScopeType, WrapperDef } from "../interfaces";
import { Scope } from "../scope";
import { createWrapper } from "../utils";

function wrapper(scope: Scope): WrapperDef {
  return (injector, session, next) => {
    session.setScope(scope);
    return next(injector, session);
  }
}

function newWrapper(scope: ScopeType): WrapperDef {
  let options: any;
  if ((scope as ScopeShape).which !== undefined) {
    options = (scope as ScopeShape).options;
    scope = (scope as ScopeShape).which;
  }
  return (injector, session, next) => {
    session.setScope(scope as Scope, options);
    return next(injector, session);
  }
}

export const Scoped = createWrapper<ScopeType, true>(newWrapper);
// export const Scoped = createWrapper(wrapper);
