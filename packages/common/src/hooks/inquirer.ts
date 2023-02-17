import { createHook } from "@adi/core";
import { resolveInstance } from "@adi/core/lib/injector/resolver";

export interface InquirerHookOptions {
  proto?: boolean
}

export const Inquirer = createHook((options?: InquirerHookOptions) => {
  const proto = Boolean(options?.proto);

  return (session, next) => {
    if (proto) {
      const inquirerSession = session.parent?.parent;
      if (inquirerSession === undefined) {
        return;
      }

      const def = inquirerSession.context.definition;
      return def.factory.data.class
    }

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
