import { createHook } from '@adi/core';
import { DELEGATE_KEY } from './delegate';

import type { Session } from '@adi/core';

export type DelegateType<T, K extends string> = T;

const uRef = {}; // fallback for undefined, null, '', false, 0

function retrieveDelegation(session: Session, key: string | symbol) {
  const delegations = session.annotations[DELEGATE_KEY];
  if (delegations && delegations.hasOwnProperty(key)) {
    return delegations[key];
  }
  if (!session.parent) {
    return uRef;
  }
  return retrieveDelegation(session.parent, key);
}

export const Delegation = createHook((key: string | symbol = 'default') => {
  return function(session, next) {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    const delegation = retrieveDelegation(session, key);
    if (delegation === uRef) {
      return next(session);
    }

    session.setFlag('side-effect');
    return delegation;
  }
}, { name: "adi:hook:delegation" });
