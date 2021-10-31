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
  newSession.shared = inquirerSession.shared;
  return newSession.injector.resolveInstance(newSession, inquirerSession.instance.scope);
}

export const Inquirer = createWrapper(() => wrapper);