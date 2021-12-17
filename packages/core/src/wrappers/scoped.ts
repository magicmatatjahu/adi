import { Scope } from "../scope";
import { createWrapper } from "../utils";

export const Scoped = createWrapper(<T>(scope: Scope<T> | T, options?: T) => {
  if (!(scope instanceof Scope)) {
    options = scope;
    scope = undefined;
  }

  return (session, next) => {
    session.setScope(scope as Scope, options);
    return next(session);
  }
}, { name: 'Scoped' });
