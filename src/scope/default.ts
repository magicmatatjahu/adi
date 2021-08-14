import { Context, Session } from "../injector";
import { STATIC_CONTEXT } from "../constants";

import { Scope } from "./index";

export class DefaultScope extends Scope {
  get name() {
    return 'Default';
  }

  public getContext(session: Session): Context {
    return session.getContext() || STATIC_CONTEXT;
  }
}