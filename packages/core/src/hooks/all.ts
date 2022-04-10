import { createHook } from "./hook";
import { SessionFlag } from "../enums";
import { wait } from "../utils";

import type { Session } from '../injector';
import type { NextHook } from '../interfaces';

export interface AllHookOptions {

}

function allHook(session: Session, next: NextHook, options: AllHookOptions) {
  if (session.hasFlag(SessionFlag.DRY_RUN)) {
    return next(session);
  }

  session.setFlag(SessionFlag.SIDE_EFFECTS);
  // fork session
  const forkedSession = session.fork();
  session.setFlag(SessionFlag.DRY_RUN);

  wait(
    next(forkedSession), // run to update session
    () => {
      // retrieve all satisfied definitions
      const record = session.ctx.injector.providers.get(forkedSession.options.token);
      // const defs = getDefinitions(record, forkedSession, options);
    }
  );
}

export const All = createHook((options: AllHookOptions = {}) => {
  return (session, next) => allHook(session, next, options);
}, { name: 'adi:hook:all' })
