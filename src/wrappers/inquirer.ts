import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(): WrapperDef {
  return (injector, session) => {
    const inquirerSession = session.parent?.parent;
    if (inquirerSession === undefined) {
      return undefined;
    }
    // Todo: Fix the workaround for `def.record.token`
    return injector.get(inquirerSession.instance?.def.record.token, inquirerSession.options, inquirerSession.meta, session.parent);
  }
}

export const Inquirer = createWrapper<undefined, false>(wrapper);
// export const Inquirer = createWrapper(wrapper);
