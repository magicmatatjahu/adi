import { SessionStatus } from "../enums";
import { Session, ProviderRecord, Injector } from "../injector";
import { DefinitionRecord, WrapperDef } from "../interfaces";
import { compareOrder, createWrapper, runWrappers, thenable } from "../utils";

interface MultiOptions {
  // by annotation key
  metaKey?: string | symbol;
  // inherite the definitions from parent injector
  inheritance?: any;
  // return only definitions
  onlyDefinitions?: boolean;
}

function getDefinitions(
  record: ProviderRecord,
  session?: Session
): DefinitionRecord[] {
  const constraintDefs = record.constraintDefs;
  const satisfiedDefs: DefinitionRecord[] = [];
  for (let i = 0, l = constraintDefs.length; i < l; i++) {
    const d = constraintDefs[i];
    if (d.constraint(session) === true) {
      satisfiedDefs.push(d);
    }
  }
  const defs = satisfiedDefs.length === 0 ? record.defs : satisfiedDefs;
  // sort definitions by @adi/order annotation
  return defs.sort(compareOrder);
}

function lastDefinitionWrapper(injector: Injector, session: Session) {
  const def = session.definition;
  return injector.resolveDefinition(def, session);
}

function resolveDefinition(def: DefinitionRecord, injector: Injector, session: Session) {
  session.definition = def;
  if (def.wrapper !== undefined) {
    return runWrappers(def.wrapper, injector, session, lastDefinitionWrapper);
  }
  return injector.resolveDefinition(def, session);
}

// TODO: Add async resolution
function wrapper(options: MultiOptions = {}): WrapperDef {
  return (injector, session, next) => {
    // annotate session with side effects
    session.setSideEffect(true);
    // fork session
    const forkedSession = session.fork();
    // annotate forked session as dry run
    forkedSession.status |= SessionStatus.DRY_RUN;
    // run next to retrieve updated session
    next(injector, forkedSession);

    // retrieve all satisfied definitions
    const defs = getDefinitions(forkedSession.record, forkedSession);

    // remove dry run flag
    forkedSession.status &= ~SessionStatus.DRY_RUN;

    const isAsync = forkedSession.status & SessionStatus.ASYNC;
    const onlyDefinitions = options.onlyDefinitions === true;

    // with metaKey case
    const metaKey = options.metaKey;
    if (metaKey !== undefined) {
      const values: Record<string | symbol, any> = {};
      const thenables = [];
      for (let i = 0, l = defs.length; i < l; i++) {
        const def = defs[i];
        const instanceSession = forkedSession.fork();
        const defKey = def.annotations[metaKey as any];
        if (defKey) {
          thenables.push(thenable(
            () => onlyDefinitions ? defs[i] : resolveDefinition(defs[i], injector, instanceSession),
            value => {
              values[defKey] = value;
            }
          ));
        }
      }
      return isAsync ? Promise.all(thenables).then(() => values) : values;
    }

    // add also check for side effects
    // passing wrappers again solve the issue when dev pass several wrappers on provider using standalone useWrapper provider (without constraint)
    const values = [];
    for (let i = 0, l = defs.length; i < l; i++) {
      const instanceSession = forkedSession.fork();
      values.push(onlyDefinitions ? defs[i] : resolveDefinition(defs[i], injector, instanceSession));
    }
    return isAsync ? Promise.all(values) : values;
  }
}

export const Multi = createWrapper<MultiOptions, false>(wrapper);
