import { createHook } from '@adi/core';

import type { InjectionItem, Injections } from '@adi/core';

export const OVERRIDE_KEY = 'adi:key:override';

export const Override = createHook((injections: Array<InjectionItem | undefined> | Injections) => {
  return (session, next) => {
    session.annotations[OVERRIDE_KEY] = injections;
    return next(session);
  }
}, { name: 'adi:hook:override' });
