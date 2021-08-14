import { Context, Injector, Session } from "../injector";
import { ScopeFlags } from "../enums";

export abstract class Scope<O = any> {
  public readonly flags: ScopeFlags = ScopeFlags.NONE;

  public static DEFAULT: Scope;
  public static SINGLETON: Scope;
  public static TRANSIENT: Scope;
  public static INSTANCE: Scope;
  public static LOCAL: Scope;
  public static PARENT: Scope;

  abstract get name(): string;

  public abstract getContext(
    session: Session,
    injector: Injector,
    options?: O,
  ): Context;

  // public toCache<T = any>(
  //   options: InjectionOptions,
  //   def: RecordDefinition<T>, 
  //   session?: InjectionSession,
  // ): boolean {
  //   return true;
  // }

  public canBeOverrided(): boolean {
    return (this.flags & ScopeFlags.CANNOT_OVERRIDE) === 0;
  }
}