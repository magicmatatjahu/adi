import { InjectionOptions, RecordDefinition, Inquirer } from "../interfaces";
import { Context } from "../tokens";
import { ScopeFlags } from "../enums";

import { Scope } from "./scope";

export class PrototypeScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.CAN_OVERRIDE;

  public getContext(options: InjectionOptions, def: RecordDefinition, inquirer: Inquirer): Context {
    if (inquirer && def === inquirer.ctxRecord.def) {
      throw Error("Cannot inject new instance of itself class (with PROTOTYPE scope)");
    }
    return new Context(options.scopeParams);
  }

  public toCache(): boolean {
    return false;
  }

  public getName(): string {
    return "Prototype";
  }
}
