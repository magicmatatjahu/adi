import { ANNOTATIONS } from "../constants"
import { createWrapper } from "../utils";
import { Token } from "../types";

export const Named = createWrapper(<T>(name: Token<T>) => {
  return (session, next) => {
    session.addLabel(ANNOTATIONS.NAMED, name);
    return next(session);
  }
});
