import { ScopeShape, ScopeType } from "../interfaces";
import { Scope } from "../scope";
import { createWrapper } from "../utils";

export const Scoped = createWrapper((scope: Scope | ScopeType) => {
  const options = (scope as ScopeShape).kind && (scope as ScopeShape).options;
  scope = (scope as ScopeShape).kind ? (scope as ScopeShape).kind : scope;

  return (session, next) => {
    session.setScope(scope as Scope, options);
    return next(session);
  }
}, { name: 'Scoped' });
