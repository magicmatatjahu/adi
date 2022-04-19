import { createHook, SessionFlag } from '@adi/core';

export const Factory = createHook(() => {
  return (session, next) => {
    if (session.hasFlag(SessionFlag.DRY_RUN)) {
      return next(session);
    }
  
    const oldSession = session.fork();
    return (...args: any[]) => {
      const newSession = oldSession.fork();
      if (Array.isArray(args) && args.length > 0) {
        newSession.meta['adi:delegations'] = args;
      }
      return next(newSession);
    }
  }
}, { name: 'adi:hook:factory' });
