import { Context, Session } from "../injector";
import { STATIC_CONTEXT } from "../constants";
import { ScopeFlags } from "../enums";

import { Scope } from "./index";

export class DefaultScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.NONE;

  get name() {
    return 'Default';
  }

  public getContext(session: Session): Context {
    return session.getContext() || STATIC_CONTEXT;
  }
}