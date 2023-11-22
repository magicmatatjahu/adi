import { Hook } from "@adi/core";

import { DELEGATE_KEY, DELEGATE_VALUE } from './delegate';

import type { Session, InjectionHookResult, NextInjectionHook } from '@adi/core';

export interface FactoryHookOptions { 
  delegations: Array<string | symbol | undefined>; 
}

export function Factory<NextValue>(options?: FactoryHookOptions) {
  const delegations = options?.delegations;

  return Hook(
    function factoryHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<(...args: any[]) => NextValue | Promise<NextValue>> {
      if (session.hasFlag('dry-run')) {
        return next(session) as any;
      }
    
      return (...args: any[]) => {
        // TODO: preserve session between calls - sometimes we can create two instances (by transient scope) but instance will be saved in one session - problem with destroying it
        const newSession = session.fork();
        const data = newSession.data;
        if (delegations) {
          const keys: Record<string | symbol, any> = {}; 
          delegations.forEach((delegation, index) => {
            delegation && (keys[delegation] = args[index])
          });
          data[DELEGATE_KEY] = keys;
        } else {
          data[DELEGATE_KEY] = args;
        }
        (data[DELEGATE_VALUE] = [] as any[]).push(...args);
        
        return next(newSession)
      }
    },
    { name: 'adi:factory' }
  )
}
