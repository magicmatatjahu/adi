import { InjectionKind } from "../enums";
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

    // TODO: Check more complex example, like A -> B -> C -> D -> B (every service is in transient scope)
    if (
      parent &&
      parent.parent &&
      parent.instance.scope.kind instanceof TransientScope &&
      session.definition === parent.parent.definition
    ) {
      throw Error("Circular injections are not allowed between providers with Transient scope. If required, create a new instance with the specified context.");
    }
    
    let ctx = options.reuseContext ? session.getContext() : undefined;
    if (ctx === undefined) {
      ctx = new Context();
      this.instancesMetadata.set(ctx, session.metadata);
      session.setSideEffect(true);
    }
    return ctx;
  }

  public canDestroy(
    event: DestroyEvent,
    instance: InstanceRecord,
  ): boolean {
    const ctx = instance.ctx;

    // operating on an instance with a context passed by user
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
    
    // on method injection
    const metadata = this.instancesMetadata.get(ctx);
    if (metadata !== undefined && metadata.kind & InjectionKind.METHOD) {
      this.instancesMetadata.delete(ctx);
      return true;
    }

    return false;
  };
}
