import { WrapperDef } from "../interfaces";
import { CONSTRAINTS } from "../constants"
import { createWrapper } from "../utils";
import { Token } from "../types";

// TODO: Add possibility to pass not only string but also references | symbols
function wrapper(name: Token): WrapperDef {
  return (injector, session, next) => {
    session.addLabels({
      [CONSTRAINTS.NAMED]: name,
    });
    return next(injector, session);
  }
}

export const Named = createWrapper<Token, true>(wrapper);
