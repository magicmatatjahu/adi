import { createHook } from "./hook";

import type { Context } from '../injector';

export const Ctx = createHook((ctx: Context) => {
  return (session, next) => {
    session.options.ctx = ctx;
    return next(session);
  }
}, { name: 'adi:hook:ctx' })