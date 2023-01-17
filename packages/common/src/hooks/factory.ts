import { createHook } from '@adi/core';

import { DELEGATION_KEY } from './delegations';

export type FactoryType<T> = (...args: any[]) => T;

export const Factory = createHook(() => {
  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }
  
    return (...args: any[]) => {
      // TODO: preserve session between calls - sometimes we can create two instances (by transient scope) but instance will be saved in one session - problem with destroying it
      const newSession = session.fork();
      if (Array.isArray(args) && args.length > 0) {
        newSession.annotations[DELEGATION_KEY] = args;
      }
      return next(newSession);
    }
  }
}, { name: 'adi:hook:factory' });
