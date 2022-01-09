import { createWrapper, Scope } from '@adi/core';

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
