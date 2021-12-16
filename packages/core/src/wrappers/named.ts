import { ANNOTATIONS } from "../constants"
import { createWrapper } from "../utils";
import { Token } from "../types";

export const Named = createWrapper((name: Token<unknown>) => {
  return (session, next) => {
    session.addAnnotations(ANNOTATIONS.NAMED, name);
    return next(session);
  }
}, { name: 'Named' });
