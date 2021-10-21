import { Token as ProviderToken } from "../types";
import { createWrapper } from "../utils";

export const Token = createWrapper((token: ProviderToken) => {
  return (session, next) => {
    session.setToken(token || session.getToken());
    return next(session);
  }
});
