import { Hook } from './hook';
import { InjectionHookKind } from '../enums';
import { wait } from '../utils';
import { ADI_HOOK_DEF } from '../private';
import { resolveProvider } from '../injector/resolver';

import type { Injector, Session } from '../injector';
import type { ProviderToken, ProviderRecord, ProviderDefinition, ProviderInstance, InjectionHook, InjectionHookContext, NextInjectionHook, InjectionHookResult } from '../types';

export function isInjectionHook<T = any, R = any>(hooks: unknown): hooks is InjectionHook<T, R> {
  if (!hooks) return false;
  return !!hooks[ADI_HOOK_DEF];
}

export function runInjectioHooks(hooks: Array<InjectionHook>, session: Session, ctx: InjectionHookContext, lastHook: NextInjectionHook) {
  if (hooks.length === 0) return lastHook(session);
  return __runInjectioHooks([...hooks, lastHook as unknown as InjectionHook], session, -1, ctx);
}

function __runInjectioHooks(hooks: Array<InjectionHook>, session: Session, index: number, ctx:InjectionHookContext) {
  return hooks[++index](session, (s: Session) => __runInjectioHooks(hooks, s, index, ctx), ctx);
}

export function runInjectioHooksWithProviders(hooks: Array<{ hook: InjectionHook, provider: ProviderRecord | null }>, session: Session, lastHook: NextInjectionHook) {
  const ctx: InjectionHookContext = { kind: InjectionHookKind.PROVIDER };
  const last: { hook: InjectionHook, provider: ProviderRecord | null } = { hook: lastHook as unknown as InjectionHook, provider: null }
  return __runInjectioHooksWithProviders([...hooks, last], session, -1, ctx);
}

function __runInjectioHooksWithProviders(hooks: Array<{ hook: InjectionHook, provider: ProviderRecord | null }>, session: Session, index: number, ctx: InjectionHookContext) {
  const { hook, provider } = hooks[++index];
  session.context.injector = (session.context.provider = provider || undefined)?.host as Injector;
  return hook(session, (s: Session) => __runInjectioHooksWithProviders(hooks, s, index, ctx), ctx);
}

export function ExistingHook<NextValue, T>(token: ProviderToken<T>) {
  return Hook(
    function existingHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<T> {
      if (session.hasFlag('dry-run')) {
        return next(session) as T;
      }
  
      const { context, inject } = session;
      context.provider = context.definition = undefined;
      inject.token = token;
      return resolveProvider(session);
    },
    { name: 'adi:hook:existing' }
  )
}

export function AliasHook<NextValue, T>(definition: ProviderDefinition<T>) {
  return Hook(
    function aliasHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<T> {
      if (session.hasFlag('dry-run')) {
        return next(session) as T;
      }
  
      const { context, inject } = session;
      inject.token = (context.provider = (context.definition = definition).provider).token;
      return resolveProvider(session);
    },
    { name: 'adi:hook:alias' }
  )
}

export type ResultHookType<T = any> = {
  session: Session,
  instance: ProviderInstance<T>,
  sideEffect: boolean,
  result: T,
}

let cachedResultHook: any | undefined;
export function ResultHook<NextValue>(): InjectionHook<NextValue, ResultHookType<NextValue>> {
  if (cachedResultHook) {
    return cachedResultHook;
  }

  return cachedResultHook = Hook(
    function resultHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<ResultHookType<NextValue>> {
      return wait(
        next(session), result => ({ 
          session,
          instance: session.context.instance!,
          sideEffect: session.hasFlag('side-effect'),
          result,
        })
      );
    },
    { name: 'adi:hook:use-alias-definition' }
  )
}
