import { createHook } from "./hook";

import type { ProviderToken } from "../interfaces";

export const Ref = createHook((ref: () => ProviderToken<any>) => {
  return (session, next) => {
    session.options.token = ref();
    return next(session);
  }
}, { name: 'adi:hook:ref' });
