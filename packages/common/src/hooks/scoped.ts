import { createHook } from "@adi/core";

import type { ScopeType } from "@adi/core/lib/scopes";

export const Scoped = createHook((scope: ScopeType) => {
  return (session, next) => {
    session.options.scope = scope;
    return next(session);
  }
}, { name: 'adi:hook:scoped' });
