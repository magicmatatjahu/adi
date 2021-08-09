import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils";

function wrapper(): WrapperDef {
  return (injector, session) => {
    const inquirerSession = session.getParent()?.getParent();
    if (inquirerSession === undefined) {
      return undefined;
    }
    // Todo: Fix the workaround for `def.record.token`
    return injector.get(inquirerSession.getInstance().def.record.token, inquirerSession.getOptions(), inquirerSession.getMetadata(), session.getParent());
  }
}

export const Inquirer = createWrapper(wrapper);
