import { createHook, SessionFlag } from '@adi/core';

import type { Session } from '@adi/core';

const uRef = {}; // fallback for undefined, null, '', false, 0
function retrieveDelegation(session: Session, key: string | symbol) {
  const delegations = session.meta['adi:delegations'];
  if (delegations && delegations.hasOwnProperty(key)) {
    return delegations[key];
  }
  if (!session.parent) return uRef;
  return retrieveDelegation(session.parent, key);
}

export const Delegate = createHook((key: string | symbol = 'default') => {
  return function(session, next) {
    if (session.hasFlag(SessionFlag.DRY_RUN)) {
      return next(session);
    }

    const delegate = retrieveDelegation(session, key);
    if (delegate === uRef) {
      return next(session);
    }

    session.setFlag(SessionFlag.SIDE_EFFECTS);
    return delegate;
  }
}, { name: "adi:hook:delegate" });