import { InjectionOptions, RecordDefinition, InjectionSession } from "../interfaces";
import { Context } from "../tokens";
import { ScopeFlags } from "../enums";

import { Scope } from "./scope";

export class PrototypeScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.CAN_OVERRIDE;

  public getContext(options: InjectionOptions, def: RecordDefinition, session: InjectionSession): Context {
    if (session && def === session.ctxRecord.def) {
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
