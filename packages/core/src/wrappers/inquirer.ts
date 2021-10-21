import { Session } from "../injector";
import { createWrapper } from "../utils";

function wrapper(session: Session) {
  const inquirerSession = session.parent?.parent;
  if (inquirerSession === undefined) {
    return undefined;
  }
  const token = inquirerSession.instance.def.record.token;
  const newSession = Session.create(token, session.metadata, session.parent);
  newSession.record = inquirerSession.record;
  newSession.definition = inquirerSession.definition;
  newSession.instance = inquirerSession.instance;
  newSession.injector = inquirerSession.injector;
  newSession.injector = inquirerSession.injector;
  return newSession.injector.resolveInstance(newSession);
}

export const Inquirer = createWrapper(() => wrapper);