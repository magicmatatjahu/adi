import { createHook } from "@adi/core";

import type { ScopeType } from "@adi/core";

export const Scoped = createHook((scope: ScopeType) => {
  return (session, next) => {
    session.iOptions.scope = scope;
    return next(session);
  }
}, { name: 'adi:hook:scoped' });
