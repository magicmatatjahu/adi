import { Injector, Session } from "../injector";
import { createNewWrapper, createWrapper } from "../utils";

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

function newWrapper(session: Session) {
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
  newSession.newImplementation = inquirerSession.newImplementation;
  return newSession.injector.resolveInstance(newSession);
}

export const NewInquirer = createNewWrapper(() => newWrapper);