import { Token as ProviderToken } from "../types";
import { createWrapper } from "../utils";

export const Token = createWrapper((token: ProviderToken) => {
  return (session, next) => {
    if (token) session.setToken(token);
    return next(session);
  }
});
