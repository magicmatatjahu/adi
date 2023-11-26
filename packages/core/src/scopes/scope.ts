import type { Context, Session, ProviderInstance } from '../injector';
import type { DestroyContext } from '../types';

export abstract class Scope<O> {
  public abstract get name(): string;

  public abstract getContext(
    session: Session,
    options: O,
  ): Context | Promise<Context>;

  public abstract shouldDestroy(
    instance: ProviderInstance,
    options: O,
    ctx: DestroyContext,
  ): boolean | Promise<boolean>

  public canBeOverrided(
    session: Session,
    options: O,
  ): boolean {
    return true;
  }

  public isDynamic(
    session: Session, 
    options: O
  ): boolean {
    return false
  }
}
