import type { Context, Session, DestroyContext } from '../injector';
import type { ProviderInstance } from '../interfaces';

export interface ScopeType<O = any> {
  (options: O): ScopeType<O>;
  kind: Scope<O>;
  options: O;
}

export abstract class Scope<O = any> {
  public abstract get name(): string;

  public abstract getContext(
    session: Session,
    options: O,
  ): Context;

  public abstract canDestroy(
    instance: ProviderInstance,
    options: O,
    ctx: DestroyContext,
  ): boolean;

  public canBeOverrided(
    session: Session,
    options: O,
  ): boolean {
    return true;
  }
}

export function createScope<O = any>(scope: Scope<O>, defaultOptions: O): ScopeType<O> {
  function scopeType(options: O): ScopeType<O> {
    return createScope(scope, { ...defaultOptions, ...options, });
  };
  (scopeType as ScopeType<O>).kind = scope;
  (scopeType as ScopeType<O>).options = defaultOptions;
  return scopeType as ScopeType<O>;
}
