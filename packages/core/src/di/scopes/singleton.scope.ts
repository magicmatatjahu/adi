import { InjectionOptions } from "../interfaces";
import { Context } from "../tokens";
import { STATIC_CONTEXT } from "../constants";
import { ScopeFlags } from "../enums";

import { Scope } from "./scope";

export class SingletonScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.NONE;

  public getContext(options: InjectionOptions): Context {
    const ctx = options.ctx || STATIC_CONTEXT;
    if (ctx !== STATIC_CONTEXT || options.scope !== undefined) {
      throw new Error("Cannot create provider with singleton scope");
    }
    return ctx;
  }

  public getName(): string {
    return "Singleton";
  }
}
