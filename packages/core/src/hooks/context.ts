import { createHook } from "./hook";

import type { Context } from '../injector';

export const Ctx = createHook((context: Context) => {
  return (session, next) => {
    session.iOptions.context = context;
    return next(session);
  }
}, { name: 'adi:hook:context' })