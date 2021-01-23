import { Context } from "../tokens";
import { ScopeFlags } from "../enums";

import { Scope } from "./scope";

export class PrototypeScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.CAN_OVERRIDE;

  public getContext(): Context {
    return new Context();
  }

  public toCache(): boolean {
    return false;
  }

  public getName(): string {
    return "Prototype";
  }
}
