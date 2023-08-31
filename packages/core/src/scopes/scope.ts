import type { Context, Session } from '../injector';
import type { ScopeInstance, ProviderInstance, DestroyContext } from '../types';

export abstract class Scope<O> {
  public abstract get name(): string;

  public abstract getContext(
    session: Session,
    options: O,
  ): Context | Promise<Context>;

  public abstract shouldDestroy(
    instance: ProviderInstance,
    options: O,
    context: DestroyContext,
  ): boolean | Promise<boolean>;

  public canBeOverrided(
    session: Session,
    options: O,
  ): boolean {
    return true;
  }
}
