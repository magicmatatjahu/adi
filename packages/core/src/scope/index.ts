import { Context, Session } from "../injector";
import { DestroyEvent, InstanceRecord } from "../interfaces";

import { DefaultScopeOptions } from "./default";
import { SingletonScopeOptions } from "./singleton";
import { TransientScopeOptions } from "./transient";

export abstract class Scope<O = any> {
  public static DEFAULT: Scope<DefaultScopeOptions>;
  public static SINGLETON: Scope<SingletonScopeOptions>;
  public static TRANSIENT: Scope<TransientScopeOptions>;

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
    return true;
  }
}
