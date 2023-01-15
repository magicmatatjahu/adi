import { createHook } from "./hook";

export const Tagged = createHook((tags: Array<string | symbol>) => {
  return (session, next) => {
    session.iOptions.annotations.tagged = tags;
    return next(session);
  }
}, { name: 'adi:hook:tagged' });