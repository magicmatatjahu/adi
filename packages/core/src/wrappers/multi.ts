import { SessionStatus } from "../enums";
import { Session, ProviderRecord } from "../injector";
import { DefinitionRecord } from "../interfaces";
import { compareOrder, createWrapper, thenable } from "../utils";

export enum MultiFlags {
  OnlySelf = 1,
}

interface MultiOptions {
  // by annotation key
  metaKey?: string | symbol;
  // inherite the definitions from parent injector
  inheritance?: MultiFlags;
}

// add also records to resolve the wrappers for appropriate records
function getDefinitionsFromRecord(
  record: ProviderRecord,
  session: Session
): DefinitionRecord[] {
  const satisfiedDefs: DefinitionRecord[] = [];
  const constraintDefs = record.constraintDefs;
  for (let i = 0, l = constraintDefs.length; i < l; i++) {
    const d = constraintDefs[i];
    if (d.constraint(session) === true) {
      satisfiedDefs.push(d);
    }
  }
  return satisfiedDefs.length === 0 ? record.defs : satisfiedDefs;
}

function getDefinitions(
  record: ProviderRecord,
  session: Session,
  options: MultiOptions,
): DefinitionRecord[] {
  let defs = getDefinitionsFromRecord(record, session);
  if (options.inheritance & MultiFlags.OnlySelf) {
    return defs;
  }

  const importedRecords = record.host.importedRecords.get(record.token);
  importedRecords && importedRecords.forEach(importedRecord => {
    defs = defs.concat(getDefinitionsFromRecord(importedRecord, session));
  })
  // sort definitions by @adi/order annotation
  return defs.sort(compareOrder);
}

export const Multi = createWrapper((options: MultiOptions = {}) => {
  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }
  
    // annotate session with side effects
    session.setSideEffect(true);
    // fork session
    const forkedSession = session.fork();
    // annotate forked session as dry run
    forkedSession.status |= SessionStatus.DRY_RUN;
    // run next to retrieve updated session
    next(forkedSession);

    // check if resolution is async
    const isAsync = forkedSession.status & SessionStatus.ASYNC;

    // retrieve all satisfied definitions
    const record = session.injector.records.get(forkedSession.getToken());
    const defs = getDefinitions(record, forkedSession, options);

    // with metaKey case
    const metaKey = options.metaKey;
    if (metaKey !== undefined) {
      const values: Record<string | symbol, any> = {};
      const thenables = [];
      for (let i = 0, l = defs.length; i < l; i++) {
        const def = defs[i];
        const instanceSession = session.fork();
        instanceSession.definition = defs[i];
        const defKey = def.annotations[metaKey as any];

        if (defKey) {
          thenables.push(thenable(
            () => next(instanceSession),
            value => {
              values[defKey] = value;
            }
          ));
        }
      }
      return isAsync ? Promise.all(thenables).then(() => values) : values;
    }

    const values = [];
    for (let i = 0, l = defs.length; i < l; i++) {
      const instanceSession = session.fork();
      instanceSession.definition = defs[i];
      values.push(next(instanceSession));
    }
    return isAsync ? Promise.all(values) : values;
  }
});
