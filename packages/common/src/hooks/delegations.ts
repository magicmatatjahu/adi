import { createHook } from '@adi/core';

export const DELEGATION_KEY = 'adi:key:delegations';

export const Delegations = createHook((delegations: Record<string | symbol, any>) => {
  return (session, next) => {
    session.annotations[DELEGATION_KEY] = delegations;
    return next(session);
  }
}, { name: "adi:hook:delegations" });
