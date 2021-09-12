import { Context, Session } from "../injector";
import { DestroyEvent, InjectionMetadata, InstanceRecord } from "../interfaces";

import { Scope } from "./index";

export interface TransientScopeOptions {
  reuseContext?: boolean;
}

const defaultOptions: TransientScopeOptions = {
  reuseContext: true
}

export class TransientScope extends Scope<TransientScopeOptions> {
  private instancesMetadata = new WeakMap<Context, InjectionMetadata>();

  get name() {
    return 'Transient';
  }

  public getContext(session: Session, options = defaultOptions): Context {
    const parent = session.parent;
    if (parent && session.definition === parent.definition) {
      throw Error("Cannot inject new instance of itself class (with TRANSIENT scope)");
    }
    
    let ctx = options.reuseContext ? session.getContext() : undefined;
    if (ctx === undefined) {
      ctx = new Context();
      this.instancesMetadata.set(ctx, session.metadata);
      session.setSideEffect(true);
    }
    return ctx;
  }

  public onDestroy(
    event: DestroyEvent,
    instance: InstanceRecord,
  ): boolean {
    const ctx = instance.ctx;

    // when operating on an instance with a context created by scope
    if (this.instancesMetadata.has(ctx) === false) {
      // destroy only with `injector` event and with no parents
      if (event === 'injector' && (instance.parents === undefined || instance.parents.size === 0)) {
        this.instancesMetadata.delete(ctx);
        return true;
      }
      return false;
    }

    // with no parents parents - mainly `manually` event
    if (instance.parents === undefined || instance.parents.size === 0) {
      this.instancesMetadata.delete(ctx);
      return true;
    }
    
    // when on method injection
    const metadata = this.instancesMetadata.get(ctx);
    if (metadata !== undefined && metadata.propertyKey !== undefined && metadata.index !== undefined) {
      this.instancesMetadata.delete(ctx);
      return true;
    }

    return false;
  };
}
