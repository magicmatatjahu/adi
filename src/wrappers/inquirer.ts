import { Injector, Session } from "../injector";
import { createWrapper } from "../utils";

function wrapper(injector: Injector, session: Session) {
  const inquirerSession = session.parent?.parent;
  if (inquirerSession === undefined) {
    return undefined;
  }
  const token = inquirerSession.instance?.def.record.token;
  const newSession = new Session(undefined, undefined, undefined, inquirerSession.options, inquirerSession.meta, session.parent);
  return injector.get(token, undefined, newSession);
}

export const Inquirer = createWrapper<undefined, false>(() => wrapper);
