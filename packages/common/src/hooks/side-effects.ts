import { createWrapper, Session, NextWrapper } from '@adi/core';
import { thenable } from '@adi/core/lib/utils';

function wrapper(session: Session, next: NextWrapper) {
  return thenable(
    () => next(session),
    value => {
      session.setSideEffect(true);
      return value;
    }
  );
}

export const SideEffects = createWrapper(() => wrapper, { name: 'SideEffects' });