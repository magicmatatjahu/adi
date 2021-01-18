import { InjectionOptions, RecordDefinition, Inquirer } from "../interfaces";
import { Context } from "../tokens";
import { ScopeFlags } from "../enums";

import { Scope } from "./scope";

export class TransientScope extends Scope {
  public readonly canOverride: boolean = true;
  public readonly flags: ScopeFlags = ScopeFlags.CAN_OVERRIDE;

  getContext(options: InjectionOptions, def: RecordDefinition, inquirer: Inquirer): Context {
    if (inquirer && def === inquirer.ctxRecord.def) {
      throw Error("Cannot inject new instance of itself class (with TRANSIENT scope)");
    }
    let ctx = options.ctx;
    if (!ctx) {
      ctx = new Context(options.scopeParams);
    }
    return ctx;
  }

  public getName(): string {
    return "transient";
  }
}
