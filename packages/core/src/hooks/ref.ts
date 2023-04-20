import { createHook } from "./hook";
import { wait } from '../utils';

import type { ProviderToken } from "../interfaces";

export const Ref = createHook((ref: () => ProviderToken | Promise<ProviderToken>) => {
  let token: ProviderToken | undefined;
  return (session, next) => {
    return wait(
      token === undefined ? ref() : token,
      result => {
        session.iOptions.token = token = result;
        return next(session);
      }
    );
  }
}, { name: 'adi:hook:ref' });
