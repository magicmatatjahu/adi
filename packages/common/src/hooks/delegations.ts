import { createHook } from '@adi/core';

export const Delegations = createHook((delegations: Record<string | symbol, any>) => {
  return (session, next) => {
    session.meta['adi:delegations'] = delegations;
    return next(session);
  }
}, { name: "adi:hook:delegations" });