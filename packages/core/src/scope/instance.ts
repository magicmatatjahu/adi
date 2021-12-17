import { Context, Session } from "../injector";
import { DestroyEvent, InjectionMetadata, InstanceRecord } from "../interfaces";
import { InjectionKind } from "../enums";

import { Scope } from "./index";

export interface InstanceScopeOptions {
  reuseContext?: boolean;
  destroy?: boolean;
}

const defaultOptions: InstanceScopeOptions = {
  reuseContext: true,
  destroy: false,
}

export class InstanceScope extends Scope<InstanceScopeOptions> {
  private contexts = new WeakMap<InstanceRecord, Context>();
  private instances = new WeakMap<Context, InstanceRecord>();
  private instancesMetadata = new WeakMap<Context, InjectionMetadata>();

  get name() {
    return 'Instance';
  }

  public getContext(session: Session, options: InstanceScopeOptions = defaultOptions): Context {
    const parent = session.parent;

    // if parent session in `undefined` or custom Context is passed treat scope as Transient
    if (parent === undefined || (options.reuseContext === true && session.getContext())) {
      return Scope.TRANSIENT.getContext(session, options);
    }

    const parentInstance = parent.instance;
    let ctx: Context = this.contexts.get(parentInstance);
    if (ctx === undefined) {
      ctx = new Context();
      this.contexts.set(parentInstance, ctx);
      this.instances.set(ctx, parentInstance);
      this.instancesMetadata.set(ctx, session.metadata);
    }
    session.setSideEffect(true);
    return ctx;
  }

  public canDestroy(
    event: DestroyEvent,
    instance: InstanceRecord,
    options: InstanceScopeOptions = defaultOptions,
  ): boolean {
    const ctx = instance.ctx;
    
    // passed custom context - treat scope as Transient
    if (this.instances.has(ctx) === false) {
      return Scope.TRANSIENT.canDestroy(event, instance, options);
    }

    // when no parent
    if (instance.parents === undefined || instance.parents.size === 0) {
      const parentInstance = this.instances.get(ctx);
      this.contexts.delete(parentInstance);
      this.instances.delete(ctx);
      return true;
    }

    // on function injection
    const metadata = this.instancesMetadata.get(ctx);
    if (metadata && metadata.kind & InjectionKind.FUNCTION && options.destroy) {
      this.instancesMetadata.delete(ctx);
      return true;
    }

    return false;
  };
}
