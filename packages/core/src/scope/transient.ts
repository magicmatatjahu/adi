import { Context, Session } from "../injector";
import { DestroyEvent, InstanceRecord } from "../interfaces";

import { Scope } from "./index";

export interface TransientScopeOptions {
  reuseContext?: boolean;
}

const defaultOptions: TransientScopeOptions = {
  reuseContext: true
}

export class TransientScope extends Scope<TransientScopeOptions> {
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
      session.setSideEffect(true);
      ctx = new Context();
    }
    return ctx;
  }

  public onDestroy(
    _: DestroyEvent,
    instance: InstanceRecord,
  ): boolean {
    // if metadata doesn't exist then instance is retrieved by `injector.get*(()` - don't call onDestroy hook
    const metadata = instance.metadata;
    if (!metadata) return false;

    // TODO: Think about how to not destroy the instance which is created by custom context (context isn't created by scope, but passed by user) 
    // destroy in case of method injection
    if (metadata.propertyKey !== undefined && metadata.index !== undefined) {
      return true;
    }

    // destroy only when parents don't exist 
    return instance.parents === undefined || instance.parents.size === 0;
  };
}
