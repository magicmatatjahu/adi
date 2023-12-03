import { Hook } from "./hook";

import type { Session } from '../injector/session';
import type { InjectionAnnotations, InjectionHookResult, NextInjectionHook } from '../types';

export function Annotations<NextValue>(annotations: InjectionAnnotations) {
  return Hook(
    function annotationsHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      Object.assign(session.annotations, annotations)
      return next(session);
    },
    { name: 'adi:annotations' }
  )
}
