import { Token } from "../types";
import { createWrapper } from "../utils";

export const Ref = createWrapper((ref: () => Token) => {
  return (session, next) => {
    session.setToken(ref());
    return next(session);
  }
});