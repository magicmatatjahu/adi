import { createHook } from "./hook";

import type { ScopeType } from "../scopes";

export const Scoped = createHook((scope: ScopeType) => {
  return (session, next) => {
    session.options.scope = scope;
    return next(session);
  }
}, { name: 'adi:hook:scoped' });
