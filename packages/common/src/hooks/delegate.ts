import { Hook } from '@adi/core';

import type { Session, InjectionHookResult, NextInjectionHook } from '@adi/core';

// TODO: Make it as single key with delegation and values
export const DELEGATE_KEY = 'adi:key:delegate-key';
export const DELEGATE_VALUE = 'adi:key:delegate-value';

export function getDelegations(session: Session, delegations?: Record<string | symbol, any>) {
  const data = session.data;
  return data[DELEGATE_KEY] || (data[DELEGATE_KEY] = delegations);
}

export function Delegate<NextValue>(delegations: Record<string | symbol, any>) {  
  return Hook(
    function delegateHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      getDelegations(session, delegations)
      return next(session);
    },
    { name: 'adi:delegate' }
  )
}
