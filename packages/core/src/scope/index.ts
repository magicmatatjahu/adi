import { Context, Session } from "../injector";
import { DestroyEvent, InstanceRecord } from "../interfaces";
import { ScopeFlags } from "../enums";

import { DefaultScopeOptions } from "./default";
import { SingletonScopeOptions } from "./singleton";
import { LocalScopeOptions } from "./local";
import { RequestScopeOptions } from "./request";
import { InstanceScopeOptions } from "./instance";
import { TransientScopeOptions } from "./transient";

export abstract class Scope<O = any> {
  public readonly flags: ScopeFlags = ScopeFlags.NONE;

  public static DEFAULT: Scope<DefaultScopeOptions>;
  public static SINGLETON: Scope<SingletonScopeOptions>;
  public static TRANSIENT: Scope<TransientScopeOptions>;
  public static INSTANCE: Scope<InstanceScopeOptions>;
  public static LOCAL: Scope<LocalScopeOptions>;
  public static REQUEST: Scope<RequestScopeOptions>;

  abstract get name(): string;

  public abstract getContext(
    session: Session,
    options: O,
  ): Context;

  public create(
    session: Session,
    options: O,
  ) {
    return session.definition.factory(session.injector, session);
  }

  public abstract canDestroy(
    event: DestroyEvent,
    instance: InstanceRecord,
    options: O,
  ): boolean;

  public canBeOverrided(): boolean {
    return (this.flags & ScopeFlags.CANNOT_OVERRIDE) === 0;
  }
}
