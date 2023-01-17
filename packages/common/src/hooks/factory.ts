import { createHook } from '@adi/core';

import { DELEGATE_KEY } from './delegate';

export type FactoryType<T> = (...args: any[]) => T;

export interface FactoryHookOptions {
  delegations: Record<string | symbol, any>,
}

export const Factory = createHook((options?: FactoryHookOptions) => {
  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }
  
    return (...args: any[]) => {
      // TODO: preserve session between calls - sometimes we can create two instances (by transient scope) but instance will be saved in one session - problem with destroying it
      const newSession = session.fork();
      if (Array.isArray(args) && args.length > 0) {
        newSession.annotations[DELEGATE_KEY] = args;
      }
      return next(newSession);
    }
  }
}, { name: 'adi:hook:factory' });
