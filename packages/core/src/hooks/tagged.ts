import { createHook } from "./hook";

export const Tagged = createHook((tags: Array<string | symbol>) => {
  return (session, next) => {
    session.options.annotations['adi:tags'] = tags;
    return next(session);
  }
}, { name: 'adi:hook:tagged' });
