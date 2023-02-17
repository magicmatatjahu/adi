import { createHook } from '@adi/core';

import { DELEGATE_KEY, DELEGATE_VALUE } from './delegate';

export type FactoryType<T> = (...args: any[]) => T;

export interface FactoryHookOptions {
  delegations: Array<string | symbol | undefined>;
}

export const Factory = createHook((options?: FactoryHookOptions) => {
  const delegations = options?.delegations;

  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }
  
    return (...args: any[]) => {
      // TODO: preserve session between calls - sometimes we can create two instances (by transient scope) but instance will be saved in one session - problem with destroying it
      const newSession = session.fork();
      const annotations = newSession.annotations;
      if (delegations) {
        const keys = {}; 
        delegations.forEach((delegation, index) => (keys[delegation] = args[index]));
        annotations[DELEGATE_KEY] = keys;
      } else {
        annotations[DELEGATE_KEY] = args;
      }
      (annotations[DELEGATE_VALUE] = []).push(...args);
      
      return next(newSession);
    }
  }
}, { name: 'adi:hook:factory' });
