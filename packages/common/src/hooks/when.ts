import { Hook, wait } from "@adi/core";
import { runInjectioHooks, useHooks } from "@adi/core/lib/hooks/private";

import type { Session, NextInjectionHook, InjectionHook, InjectFunctionResult, InjectionHookContext, UseHooks } from '@adi/core';

export function When<NextValue, Then, Otherwise = null>(input: {
  when: (session: Session) => boolean | Promise<boolean>,
  then: (use: UseHooks<NextValue>) => Then,
  otherwise?: (use: UseHooks<NextValue>) => Otherwise,
}) {
  const { when, then, otherwise } = input;
  const thenHooks = then(useHooks) as Array<InjectionHook>;
  const otherwiseHooks = (otherwise ? otherwise(useHooks) : []) as Array<InjectionHook>;

  return Hook(
    function whenHook(session: Session, next: NextInjectionHook<NextValue>, ctx: InjectionHookContext): InjectFunctionResult<Otherwise extends null ? (NextValue | Then) : (Then | Otherwise)> {
      session.setFlag('dynamic');

      return wait(
        when(session),
        result => {
          const hooks = result ? thenHooks : otherwiseHooks
          const newCtx: Partial<InjectionHookContext> = { kind: ctx.kind, hooks, current: undefined }
          return runInjectioHooks(hooks, session, newCtx, next);
        }
      )
    },
    { name: 'adi:when' }
  )
}
