import { createHook } from "@adi/core";
import { resolveInstance } from "@adi/core/lib/injector/resolver";

export const Inquirer = createHook(() => {
  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    const inquirerSession = session.parent?.parent;
    if (inquirerSession === undefined) {
      return;
    }
    
    Object.assign(session.injection.options, inquirerSession.injection.options);
    Object.assign(session.context, inquirerSession.context);
    return resolveInstance(session);
  }
}, { name: 'adi:hook:inquirer' });
