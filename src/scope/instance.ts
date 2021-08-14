import { Context, Injector, Session } from "../injector";
import { InstanceRecord } from "../interfaces";

import { Scope } from "./index";

export class InstanceScope extends Scope {
  private instances = new Map<InstanceRecord, Context>();

  get name() {
    return 'Instance';
  }

  public getContext(session: Session, injector: Injector): Context {
    const parent = session.getParent();

    // if parent session in `undefined` or custom Context exists treat scope as Transient
    if (parent === undefined || session.getContext()) {
      return Scope.TRANSIENT.getContext(session, injector);
    }

    const instance = this.getNearestInstance(parent);
    let ctx: Context = this.instances.get(instance);
    if (ctx === undefined) {
      ctx = new Context();
      this.instances.set(instance, ctx);
    }
    session.setSideEffect(true);
    return ctx;
  }

  private getNearestInstance(session: Session): InstanceRecord | undefined {
    const instance = session.getInstance();
    const parent = session.getParent()
    if (instance === undefined && parent) {
      return this.getNearestInstance(parent);
    }
    return instance;
  }
}
