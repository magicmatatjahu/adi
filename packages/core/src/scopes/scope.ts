import type { Context } from '../injector/context';
import type { Session } from '../injector/session';

export interface ScopeType<O = any> {
  (options: O): {
    scope: Scope<O>;
    options: O;
  };
  scope: Scope<O>;
  options: O;
}

export abstract class Scope<O = any> {
  public abstract get name(): string;

  public abstract getContext(
    session: Session,
    options: O,
  ): Context;

  // public abstract canDestroy(
  //   // event: DestroyEvent,
  //   session: Session,
  //   options: O,
  // ): boolean;

  public canBeOverrided(): boolean {
    return true;
  }
}

export function createScope<O = any>(scope: Scope<O>, defaultOptions: O): ScopeType<O> {
  function scopeType(options: O) {
    return {
      scope,
      options: {
        ...defaultOptions,
        ...options,
      },
    }
  };
  (scopeType as ScopeType<O>).scope = scope;
  (scopeType as ScopeType<O>).options = defaultOptions;
  return scopeType as ScopeType<O>;
}
