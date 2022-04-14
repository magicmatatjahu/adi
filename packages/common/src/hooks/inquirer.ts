import { createHook } from "@adi/core";
import { resolveInstance } from "@adi/core/lib/injector/resolver";

import type { Session } from "@adi/core";

function inquirerHook(session: Session) {
  const inquirerSession = session.parent?.parent;
  if (inquirerSession === undefined) {
    return;
  }
  Object.assign(session.ctx, inquirerSession.ctx);
  Object.assign(session.options, inquirerSession.options);
  return resolveInstance(session);
}

export const Inquirer = createHook(() => inquirerHook, { name: 'adi:hook:inquirer' });
