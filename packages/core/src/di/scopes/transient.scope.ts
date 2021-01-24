import { InjectionOptions, RecordDefinition, Inquirer } from "../interfaces";
import { Context } from "../tokens";
import { ScopeFlags, InjectionFlags } from "../enums";

import { Scope } from "./scope";

const nonCacheableFlags = InjectionFlags.METHOD_PARAMETER & InjectionFlags.FACTORY;

export class TransientScope extends Scope {
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

  public toCache<T = any>(
    options: InjectionOptions,
    def: RecordDefinition<T>, 
    inquirer?: Inquirer,
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
