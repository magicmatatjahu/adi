import { SessionStatus } from "../enums";
import { NilInjector, Session } from "../injector";
import { NextWrapper } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(session: Session, next: NextWrapper) {
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
