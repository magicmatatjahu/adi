import { Hook } from './hook';
import { InjectionHookKind } from '../enums';
import { ADI_HOOK_DEF } from '../private';
import { resolveProvider } from '../injector/resolver';

import type { Injector, Session, ProviderRecord, ProviderDefinition } from '../injector';
import type { ProviderToken, InjectionHook, InjectionHookContext, InjectionHookDefinition, NextInjectionHook, InjectionHookResult, UseHooks } from '../types';

export function isInjectionHook<T = any, R = any>(hooks: unknown): hooks is InjectionHook<T, R> {
  if (!hooks) return false;
  return !!hooks[ADI_HOOK_DEF];
}

export function getInjectionHookDef(hook: unknown): InjectionHookDefinition | undefined {
  return hook?.[ADI_HOOK_DEF]
}

export const useHooks: UseHooks<any> = (...hooks: InjectionHook[]): InjectionHook[] => {
  return hooks;
}

export function runInjectioHooks(hooks: Array<InjectionHook>, session: Session, ctx: Partial<InjectionHookContext>, lastHook: NextInjectionHook) {
  if (hooks.length === 0) return lastHook(session);
  hooks = [...hooks, lastHook as unknown as InjectionHook]
  return __runInjectioHooks(hooks, session, -1, { ...ctx, hooks });
}

function __runInjectioHooks(hooks: Array<InjectionHook>, session: Session, index: number, ctx: Partial<InjectionHookContext>) {
  const current = hooks[++index];
  return current(session, (s: Session) => __runInjectioHooks(hooks, s, index, ctx), { ...ctx, current } as InjectionHookContext);
}

export function runInjectioHooksWithProviders(hooks: Array<{ hook: InjectionHook, provider: ProviderRecord | null }>, session: Session, lastHook: NextInjectionHook) {
  const last: { hook: InjectionHook, provider: ProviderRecord | null } = { hook: lastHook as unknown as InjectionHook, provider: null }
  hooks = [...hooks, last]
  const ctx: Partial<InjectionHookContext> = { kind: InjectionHookKind.PROVIDER, hooks: hooks as any };
  return __runInjectioHooksWithProviders(hooks, session, -1, ctx);
}

function __runInjectioHooksWithProviders(hooks: Array<{ hook: InjectionHook, provider: ProviderRecord | null }>, session: Session, index: number, ctx: Partial<InjectionHookContext>) {
  const { hook, provider } = hooks[++index];
  session.injector = (session.provider = provider || undefined)?.host as Injector;
  return hook(session, (s: Session) => __runInjectioHooksWithProviders(hooks, s, index, ctx), { ...ctx, current: hook } as InjectionHookContext);
}

export function ExistingHook<NextValue, T>(token: ProviderToken<T>) {
  return Hook(
    function existingHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<T> {
      if (session.hasFlag('dry-run')) {
        return next(session) as T;
      }
      
      session.token = token;
      session.provider = session.definition = undefined;
      return resolveProvider(session);
    },
    { name: 'adi:hook:existing' }
  )
}

export function AliasHook<NextValue, T>(definition: ProviderDefinition) {
  return Hook(
    function aliasHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<T> {
      if (session.hasFlag('dry-run')) {
        return next(session) as T;
      }
  
      session.token = (session.provider = (session.definition = definition).provider).token;
      return resolveProvider(session);
    },
    { name: 'adi:hook:alias' }
  )
}
