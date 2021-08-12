import { Context, Session } from "../injector";

import { Scope } from "./index";

export class TransientScope extends Scope {
  get name() {
    return 'Transient';
  }

  public getContext(session: Session): Context {
    const parent = session.getParent();
    if (parent && session.getDefinition() === parent.getDefinition()) {
      throw Error("Cannot inject new instance of itself class (with TRANSIENT scope)");
    }
    let ctx = session.getContext();
    if (ctx === undefined) {
      session.setSideEffect(true);
      ctx = new Context();
    }
    return ctx;
  }
}