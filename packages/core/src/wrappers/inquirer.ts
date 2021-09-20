import { Injector, Session } from "../injector";
import { createWrapper } from "../utils";

function wrapper(injector: Injector, session: Session) {
  const inquirerSession = session.parent?.parent;
  if (inquirerSession === undefined) {
    return undefined;
  }
  const token = inquirerSession.instance.def.record.token;
  const newSession = Session.create(token, session.metadata, session.parent);
  newSession.record = inquirerSession.record;
  newSession.definition = inquirerSession.definition;
  newSession.instance = inquirerSession.instance;
  return injector.resolveInstance(newSession);
}

export const Inquirer = createWrapper<undefined, false>(() => wrapper);
