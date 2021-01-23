import { InjectionOptions, RecordDefinition, Inquirer } from "../interfaces";
import { Context } from "../tokens";
import { ScopeFlags } from "../enums";

import { Scope } from "./scope";

export class StrictTransientScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.NONE;

  public getContext(options: InjectionOptions): Context {
    if (options.scope !== undefined) {
      throw new Error("Cannot override StrictTransient scope");
    }
    return new Context();
  }

  public toCache(): boolean {
    return false;
  }

  public getName(): string {
    return "StrictTransient";
  }
}
