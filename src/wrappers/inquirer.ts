import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";
import { createWrapper as cr } from "../utils/wrappers.new";

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

export const NewInquirer = cr<undefined, false>(wrapper);
export const Inquirer = createWrapper(wrapper);
