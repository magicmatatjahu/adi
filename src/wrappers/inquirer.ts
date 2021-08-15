import { Session } from "../injector";
import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(): WrapperDef {
  return (injector, session) => {
    const inquirerSession = session.parent?.parent;
    if (inquirerSession === undefined) {
      return undefined;
    }
    // Todo: Fix the workaround for `def.record.token`
    const newSession = new Session(undefined, undefined, undefined, inquirerSession.options, inquirerSession.meta, session.parent);
    return injector.get(inquirerSession.instance?.def.record.token, undefined, newSession);
  }
}

export const Inquirer = createWrapper<undefined, false>(wrapper);
// export const Inquirer = createWrapper(wrapper);
