import type { Context, Session } from '../injector';
import type { ProviderInstance, DestroyContext, ProviderDefinition, FactoryDefinition } from '../interfaces';

export interface ScopeInstance<O = any> {
  (options: O): ScopeInstance<O>;
  kind: Scope<O>;
  options: O;
}

export abstract class Scope<O = any> {
  public abstract get name(): string;

  public abstract getContext(
    session: Session,
    options: O,
  ): Context;

  public create(
    session: Session,
    options: O,
  ) {
    const { injector, definition: { factory } } = session.context;
    return factory.resolver(injector, session, factory.data);
  }

  public abstract shouldDestroy(
    instance: ProviderInstance,
    options: O,
    context: DestroyContext,
  ): boolean;

  // TODO: think about it
  public canBeOverrided(
    session: Session,
    options: O,
  ): boolean {
    return true;
  }

  // public abstract getOptions(): O;
}

export function createScope<O = any>(scope: Scope<O>, defaultOptions: O): ScopeInstance<O> {
  function scopeType(options: O): ScopeInstance<O> {
    return createScope(scope, { ...defaultOptions, ...options, });
  };
  (scopeType as ScopeInstance<O>).kind = scope;
  (scopeType as ScopeInstance<O>).options = defaultOptions;
  return scopeType as ScopeInstance<O>;
}
