import { Context, Injector, Session } from "../injector";
import { DestroyEvent, InstanceRecord } from "../interfaces";

import { Scope } from "./index";

export interface InstanceScopeOptions {
  reuseContext?: boolean;
}

const defaultOptions: InstanceScopeOptions = {
  reuseContext: true
}

export class InstanceScope extends Scope<InstanceScopeOptions> {
  private instances = new WeakMap<InstanceRecord, Context>();
  private contexts = new WeakMap<Context, InstanceRecord>();

  get name() {
    return 'Instance';
  }

  public getContext(session: Session, options: InstanceScopeOptions = defaultOptions, injector: Injector): Context {
    const parent = session.parent;

    // if parent session in `undefined` or custom Context is passed treat scope as Transient
    if (parent === undefined || (options.reuseContext === true && session.getContext())) {
      return Scope.TRANSIENT.getContext(session, options, injector);
    }

    const parentInstance = parent.instance;
    let ctx: Context = this.instances.get(parentInstance);
    if (ctx === undefined) {
      ctx = new Context();
      this.instances.set(parentInstance, ctx);
      this.contexts.set(ctx, parentInstance);
    }
    session.setSideEffect(true);
    return ctx;
  }

  public onDestroy(
    event: DestroyEvent,
    instance: InstanceRecord,
    options: InstanceScopeOptions = defaultOptions,
    injector: Injector,
  ): boolean {
    const ctx = instance.ctx;
    
    // if ctx doesn't exist in the Instance scope treat scope as Transient
    if (this.contexts.has(ctx) === false) {
      return Scope.TRANSIENT.onDestroy(event, instance, options, injector);
    }

    // when no parent
    if (instance.parents === undefined || instance.parents.size === 0) {
      const parentInstance = this.contexts.get(ctx);
      this.instances.delete(parentInstance);
      this.contexts.delete(ctx);
      return true;
    }

    return false;
  };
}
