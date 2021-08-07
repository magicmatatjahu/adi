import { WrapperDef } from "../interfaces";
import { CONSTRAINTS } from "../constants"
import { createWrapper } from "../utils";

function wrapper(name: string): WrapperDef {
  return (injector, session, next) => {
    session.addLabels({
      [CONSTRAINTS.NAMED]: name,
    });
    return next(injector, session);
  }
}

export const Named = createWrapper(wrapper);
