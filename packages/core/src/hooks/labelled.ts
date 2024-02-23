import { Hook } from "./hook";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export function Labelled<NextValue>(labels: Record<string | symbol, any>) {
  return Hook(
    function labelledHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      const currentLabels = session.annotations.labels || [];
      Object.assign(currentLabels, labels)
      return next(session);
    },
    { name: 'adi:labelled' }
  )
}