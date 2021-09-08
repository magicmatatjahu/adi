import { Context, Injector, Session } from "../injector";
import { InstanceRecord } from "../interfaces";

import { Scope } from "./index";

export interface InstanceScopeOptions {
  reuseContext?: boolean;
}

const defaultOptions: InstanceScopeOptions = {
  reuseContext: true
}

export class InstanceScope extends Scope<InstanceScopeOptions> {
  private instances = new WeakMap<InstanceRecord, Context>();

  get name() {
    return 'Instance';
  }

  public getContext(session: Session, options: InstanceScopeOptions = defaultOptions, injector: Injector): Context {
    const parent = session.parent;

    // if parent session in `undefined` or custom Context exists treat scope as Transient
    if (parent === undefined || (options.reuseContext === true && session.getContext())) {
      return Scope.TRANSIENT.getContext(session, options, injector);
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
    const instance = session.instance;
    const parent = session.parent;
    if (instance === undefined && parent) {
      return this.getNearestInstance(parent);
    }
    return instance;
  }
}
