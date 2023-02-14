import { createHook, Context, TransientScope } from "@adi/core";

export const New = createHook((data?: Record<string, any>) => {
  return (session, next) => {
    if (data) {
      session.iOptions.context = new Context(data);
    }
    session.iOptions.scope = TransientScope;
    return next(session);
  }
}, { name: 'adi:hook:new' });
