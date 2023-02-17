import { createHook } from '@adi/core';

// TODO: Make it as single key with delegation and values
export const DELEGATE_KEY = 'adi:key:delegate-key';
export const DELEGATE_VALUE = 'adi:key:delegate-value';

export const Delegate = createHook((delegations: Record<string | symbol, any>) => {
  return (session, next) => {
    session.annotations[DELEGATE_KEY] = delegations;
    return next(session);
  }
}, { name: "adi:hook:delegate" });
