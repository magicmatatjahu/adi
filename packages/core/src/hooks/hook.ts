import { ADI_HOOK_DEF } from "../private";
import { InjectionHookKind } from "../enums";

import type { Session } from "../injector";
import type { ProviderRecord, InjectionHook, InjectionHookOptions, InjectionHookFn, NextInjectionHook, InjectionHookContext } from "../interfaces";

export type InjectionHookResult<T> = T extends InjectionHook<infer R> ? R : unknown;

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

export function runHooks(hooks: Array<InjectionHook>, session: Session, ctx: Pick<InjectionHookContext, 'kind'>, lastHook: NextInjectionHook) {
  if (hooks.length === 0) return lastHook(session);
  return __runHooks([...hooks, lastHook as unknown as InjectionHook], session, -1, ctx);
}

function __runHooks(hooks: Array<InjectionHook>, session: Session, index: number, ctx: Pick<InjectionHookContext, 'kind'>) {
  return hooks[++index](session, (s: Session) => __runHooks(hooks, s, index, ctx), ctx);
}

export function runHooksWithProviders(hooks: Array<{ hook: InjectionHook, provider: ProviderRecord }>, session: Session, lastHook: NextInjectionHook) {
  const ctx: Pick<InjectionHookContext, 'kind'> = { kind: InjectionHookKind.PROVIDER };
  return __runHooksWithProviders([...hooks, { hook: lastHook as unknown as InjectionHook, provider: null }], session, -1, ctx);
}

function __runHooksWithProviders(hooks: Array<{ hook: InjectionHook, provider: ProviderRecord }>, session: Session, index: number, ctx: Pick<InjectionHookContext, 'kind'>) {
  const { hook, provider } = hooks[++index];
  session.context.injector = (session.context.provider = provider)?.host;
  return hook(session, (s: Session) => __runHooksWithProviders(hooks, s, index, ctx), ctx);
}