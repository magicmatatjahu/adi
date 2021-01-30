import { InjectionOptions, RecordDefinition, InjectionSession } from "../interfaces";
import { Context } from "../tokens";
import { ScopeFlags, InjectionFlags } from "../enums";

import { Scope } from "./scope";

const nonCacheableFlags = InjectionFlags.METHOD_PARAMETER & InjectionFlags.FACTORY;

export class TransientScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.CAN_OVERRIDE;

  getContext(options: InjectionOptions, def: RecordDefinition, session: InjectionSession): Context {
    if (session && def === session.ctxRecord.def) {
      throw Error("Cannot inject new instance of itself class (with TRANSIENT scope)");
    }
    let ctx = options.ctx;
    if (!ctx) {
      ctx = new Context(options.scopeParams);
    }
    return ctx;
  }

  public toCache(
    options: InjectionOptions,
  ): boolean {
    if (options.flags & nonCacheableFlags) {
      return false;
    }
    return true;
  }

  public getName(): string {
    return "Transient";
  }
}
