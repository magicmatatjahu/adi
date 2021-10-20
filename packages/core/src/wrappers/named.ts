import { WrapperDef } from "../interfaces";
import { ANNOTATIONS } from "../constants"
import { createWrapper, createNewWrapper } from "../utils";
import { Token } from "../types";

function wrapper(name: Token): WrapperDef {
  return (injector, session, next) => {
    session.addLabel(ANNOTATIONS.NAMED, name);
    return next(injector, session);
  }
}

export const Named = createWrapper<Token, true>(wrapper);

export const NewNamed = createNewWrapper(<T>(name: Token<T>) => {
  return (session, next) => {
    session.addLabel(ANNOTATIONS.NAMED, name);
    return next(session);
  }
});
