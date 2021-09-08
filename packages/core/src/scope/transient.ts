import { Context, Session } from "../injector";

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
}
