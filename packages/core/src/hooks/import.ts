import { createHook } from "./hook";
import { wait } from "../utils";

import type { ProviderToken } from "../interfaces";

export const Import = createHook((imported: () => Promise<ProviderToken>) => {
  return (session, next) => {
    return wait(
      imported(),
      token => {
        session.iOptions.token = token;
        return next(session);
      }
    );
  }
}, { name: 'adi:hook:import' });
