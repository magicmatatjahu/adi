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
    const parents = Array.from(instance.parents || []);

    // with no parent
    // TODO: Think about it - the given instance can be created by custom Context passed by user, by Transient scope
    if (parents.length === 0) {
      return true;
    }

    // if parents size is different than 1 treat scope as Transient - for Instance scope there should be only one parent 
    // also if a single instance isn't in the `instances` Map 
    if (parents.length > 1 || this.instances.has(parents[0]) === false) {
      return Scope.TRANSIENT.onDestroy(event, instance, options, injector);
    }

    return false;
  };
}
