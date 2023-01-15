import { createHook } from "./hook";

export const Named = createHook((name: string | symbol | object) => {
  return (session, next) => {
    session.iOptions.annotations.named = name;
    return next(session);
  }
}, { name: 'adi:hook:named' });
