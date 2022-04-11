import { createHook } from "./hook";

export const Named = createHook((name: string | symbol) => {
  return (session, next) => {
    session.options.annotations['adi:named'] = name;
    return next(session);
  }
}, { name: 'adi:hook:named' });
