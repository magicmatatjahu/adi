import { ADI_HOOK_DEF } from "../private";
import { InjectionHookKind } from "../enums";

import type { Session } from "../injector";
import type { InjectionHook, InjectionHookOptions, InjectionHookFn, NextInjectionHook, InjectionHookContext } from "../interfaces";

type ReturnHookFnType<F> = F extends (...args: any) => InjectionHookFn<infer T> ? T : unknown; 

export function createHook<F extends (...args: any) => InjectionHookFn>(hook: F, options?: InjectionHookOptions): (...args: Parameters<F>) => InjectionHook<ReturnHookFnType<F>> {
  hook[ADI_HOOK_DEF] = options || true;
  return (...args: Parameters<F>) => {
    const fn = hook(...args as any);
    fn[ADI_HOOK_DEF] = options || true;
    return fn as InjectionHook<ReturnHookFnType<F>>;
  }
}

export const Hook = createHook((hook: InjectionHookFn) => {
  return hook;
}, { name: 'adi:hook:hook' });

export function isHook(hooks: unknown): hooks is InjectionHook | Array<InjectionHook> {
  if (!hooks) return false;
  return Array.isArray(hooks) ? hooks[0]?.[ADI_HOOK_DEF] : hooks[ADI_HOOK_DEF];
}

export function runHooks(hooks: Array<InjectionHook>, session: Session, kind: InjectionHookKind, lastHook: NextInjectionHook) {
  if (hooks.length === 0) return lastHook(session);
  const ctx: Omit<InjectionHookContext, 'index'> = { kind, hooks, lastHook };
  return internalRunHooks([...hooks, lastHook as unknown as InjectionHook], session, -1, ctx);
}

function internalRunHooks(hooks: Array<InjectionHook>, session: Session, index: number, ctx: Omit<InjectionHookContext, 'index'>) {
  return hooks[++index](session, (s: Session) => internalRunHooks(hooks, s, index, ctx), { ...ctx, index });
}
