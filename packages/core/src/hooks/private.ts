import { createHook } from './create-hook';
import { InjectionHookKind } from '../enums';
import { wait } from '../utils';
import { ADI_HOOK_DEF } from '../private';
import { resolveProvider } from '../injector/resolver';

import type { Session } from '../injector/session';
import type { ProviderToken, ProviderRecord, ProviderDefinition, InjectionHook, InjectionHookContext, NextInjectionHook, InjectionHookResult } from '../types';

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
  return __runInjectioHooksWithProviders([...hooks], session, -1, ctx);
}

function __runInjectioHooksWithProviders(hooks: Array<{ hook: InjectionHook, provider: ProviderRecord | null }>, session: Session, index: number, ctx: InjectionHookContext) {
  const { hook, provider } = hooks[++index];
  session.context.injector = (session.context.provider = provider)?.host;
  return hook(session, (s: Session) => __runInjectioHooksWithProviders(hooks, s, index, ctx), ctx);
}

export const UseExistingHook = createHook((token: ProviderToken) => {
  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<ResultType> => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    const { context, inject } = session;
    context.provider = context.definition = undefined;
    inject.token = token;
    return resolveProvider(session);
  }
}, { name: 'adi:hook:use-existing' });

export const UseExistingDefinitionHook = createHook((definition: ProviderDefinition) => {
  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<ResultType> => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    const { context, inject } = session;
    inject.token = (context.provider = (context.definition = definition).provider).token;
    return resolveProvider(session);
  }
}, { name: 'adi:hook:use-existing-definition' });

export const WithSessionHook = createHook(() => {
  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<{ session: Session, result: ResultType }> => {
    return wait(next(session), result => ({ 
      session, 
      result 
    }));
  }
}, { name: 'adi:hook:session' })();
