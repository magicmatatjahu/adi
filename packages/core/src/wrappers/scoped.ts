import { ScopeShape, ScopeType, WrapperDef } from "../interfaces";
import { Scope } from "../scope";
import { createNewWrapper, createWrapper } from "../utils";

function wrapper(scope: Scope | ScopeType): WrapperDef {
  return (injector, session, next) => {
    const options = (scope as ScopeShape).kind && (scope as ScopeShape).options;
    scope = (scope as ScopeShape).kind ? (scope as ScopeShape).kind : scope;
    session.setScope(scope as Scope, options);
    return next(injector, session);
  }
}

export const Scoped = createWrapper<Scope | ScopeType, true>(wrapper);

export const NewScoped = createNewWrapper((scope: Scope | ScopeType) => {
  const options = (scope as ScopeShape).kind && (scope as ScopeShape).options;
  scope = (scope as ScopeShape).kind ? (scope as ScopeShape).kind : scope;

  return (session, next) => {
    session.setScope(scope as Scope, options);
    return next(session);
  }
});
