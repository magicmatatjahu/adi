import { createHook } from "./hook";

import type { ProviderToken } from "../interfaces";

export const Token = createHook((token: ProviderToken<any>) => {
  return (session, next) => {
    session.options.token = token;
    return next(session);
  }
}, { name: 'adi:hook:token' })