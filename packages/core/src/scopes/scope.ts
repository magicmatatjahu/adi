import type { Context, Session, DestroyContext } from '../injector';

export interface ScopeType<O = any> {
  (options: O): {
    kind: Scope<O>;
    options: O;
  };
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
    session: Session,
    options: O,
    ctx: DestroyContext,
  ): boolean;

  public canBeOverrided(): boolean {
    return true;
  }
}

export function createScope<O = any>(scope: Scope<O>, defaultOptions: O): ScopeType<O> {
  function scopeType(options: O) {
    return {
      kind: scope,
      options: {
        ...defaultOptions,
        ...options,
      },
    }
  };
  (scopeType as ScopeType<O>).kind = scope;
  (scopeType as ScopeType<O>).options = defaultOptions;
  return scopeType as ScopeType<O>;
}
