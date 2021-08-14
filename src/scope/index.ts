import { Context, Injector, Session } from "../injector";
import { ScopeFlags } from "../enums";

import { LocalScopeOptions } from "./local";
import { InstanceScopeOptions } from "./instance";
import { TransientScopeOptions } from "./transient";

export abstract class Scope<O = any> {
  public readonly flags: ScopeFlags = ScopeFlags.NONE;

  public static DEFAULT: Scope<never>;
  public static SINGLETON: Scope<never>;
  public static TRANSIENT: Scope<TransientScopeOptions>;
  public static INSTANCE: Scope<InstanceScopeOptions>;
  public static LOCAL: Scope<LocalScopeOptions>;

  abstract get name(): string;

  public abstract getContext(
    session: Session,
    options: O,
    injector: Injector,
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
