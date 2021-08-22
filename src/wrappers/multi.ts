import { Session, ProviderRecord, Injector } from "../injector";
import { NextWrapper } from "../interfaces";
import { createWrapper } from "../utils";

function getDefinitions(
  record: ProviderRecord,
  session?: Session
): Array<any> {
  const constraintDefs = record.constraintDefs;
  const satisfyingDefs = [];
  for (let i = 0, l = constraintDefs.length; i < l; i++) {
    const d = constraintDefs[i];
    if (d.constraint(session) === true) {
      satisfyingDefs.push(d);
    }
  }
  return satisfyingDefs.length === 0 ? record.defs : satisfyingDefs;
}

// TODO: Add async resolution
function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  // exec wrappers chain to retrieve needed, updated session
  next(injector, session);

  const record = session.record;
  const createdDef = session.definition;
  const createdInstance = session.instance;
  const defs = getDefinitions(record, session);

  // TODO: improve function to pass wrappers chain again and copy session
  // add also check for side effects
  // passing wrappers again solve the issue when dev pass several wrappers on provider using standalone useWrapper provider (without constraint) 
  const values = [];
  for (let i = 0, l = defs.length; i < l; i++) {
    const def = defs[i];
    if (def === createdDef) {
      values.push(createdInstance.value);
    } else {
      values.push(injector.resolveDefinition(def, session));
    }
  }
  return values;
}

export const Multi = createWrapper<undefined, false>(() => wrapper);
