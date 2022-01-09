import { createWrapper, Session, NextWrapper } from '@adi/core';
import { thenable } from '@adi/core/lib/utils';

function wrapper(session: Session, next: NextWrapper) {
  return thenable(
    () => next(session),
    value => {
      session.setSideEffect(false);
      return value;
    }
  );
}

export const Memo = createWrapper(() => wrapper, { name: 'Memo' });
