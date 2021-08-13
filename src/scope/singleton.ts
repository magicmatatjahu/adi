import { Context, Session } from "../injector";
import { STATIC_CONTEXT } from "../constants";
import { ScopeFlags } from "../enums";

import { Scope } from "./index";

export class SingletonScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.CANNOT_OVERRIDE;

  get name() {
    return 'Singleton';
  }

  public getContext(session: Session): Context {
    const ctx = session.getContext();
    if (ctx && ctx !== STATIC_CONTEXT) {
      throw new Error("Cannot create provider with singleton scope");
    }
    return STATIC_CONTEXT;
  }
}