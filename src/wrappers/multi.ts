import { Injector } from "../injector";
import { InjectionSession, ProviderRecord, NextWrapper, WrapperDef } from "../interfaces";
import { CONSTRAINTS } from "../constants"
import { createWrapper } from "../utils";

function getDefinitions(
  record: ProviderRecord,
  session?: InjectionSession
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

function wrapper(_: never): WrapperDef {
  // console.log('multi');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside multi');
    // exec wrappers chain to retrieve needed, updated session
    next(injector, session);

    const options = session.options;
    const createdInstance = session.instance;
    const createdDef = createdInstance.def;
    const token = options.token || createdDef.record.token;
    const record = (injector as any).records.get(token);
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
        values.push((injector as any).resolveDef(def, options, session));
      }
    }
    return values;
  }
}

export const Multi = createWrapper(wrapper);
