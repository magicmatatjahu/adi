import { createHook } from "./hook";
import { wait } from "../utils";

import type { ProviderToken } from "../interfaces";

export const Import = createHook((imported: () => Promise<ProviderToken>) => {
  let token: ProviderToken | undefined;
  return (session, next) => {
    return wait(
      token || imported(),
      result => {
        session.iOptions.token = token = result;
        return next(session);
      }
    );
  }
}, { name: 'adi:hook:import' });
