import { createWrapper, Session, NextWrapper, SessionStatus } from '@adi/core';
import { NilInjector } from '@adi/core/lib/injector';

function wrapper(session: Session, next: NextWrapper) {
  if (session.status & SessionStatus.DRY_RUN) {
    return next(session);
  }

  const forkedSession = session.fork();
  // annotate forked session as dry run
  forkedSession.status |= SessionStatus.DRY_RUN;
  // run next to retrieve updated session
  next(forkedSession);

  // calculated injector should be the same as injector from session
  if (session.injector !== forkedSession.injector) {
    return NilInjector.get(forkedSession.getToken());
  }

  return next(session);
}

export const Self = createWrapper(() => wrapper, { name: 'Self' });
