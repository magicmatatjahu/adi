import { createHook } from '@adi/core';
import { DELEGATION_KEY } from './delegations';

import type { Session } from '@adi/core';

export type DelegateType<T, K extends string> = T;

const uRef = {}; // fallback for undefined, null, '', false, 0

function retrieveDelegation(session: Session, key: string | symbol) {
  const delegations = session.annotations[DELEGATION_KEY];
  if (delegations && delegations.hasOwnProperty(key)) {
    return delegations[key];
  }
  if (!session.parent) {
    return uRef;
  }
  return retrieveDelegation(session.parent, key);
}

export const Delegate = createHook((key: string | symbol = 'default') => {
  return function(session, next) {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    const delegate = retrieveDelegation(session, key);
    if (delegate === uRef) {
      return next(session);
    }

    session.setFlag('side-effect');
    return delegate;
  }
}, { name: "adi:hook:delegate" });
