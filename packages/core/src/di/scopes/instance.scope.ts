import { InjectionOptions } from "../interfaces";
import { Context } from "../tokens";
import { ScopeFlags } from "../enums";

import { Scope } from "./scope";

const instances = new Map<Object, Context>();

export class InstanceScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.CAN_OVERRIDE;

  public getContext(options: InjectionOptions): Context {
    const instance = options.instance;
    if (instance === undefined) {
      throw new Error("in instance scope");
    }

    let ctx: Context = undefined;
    if ((ctx = instances.get(instance)) === undefined) {
      ctx = new Context();
      instances.set(instance, ctx);
    }
    return ctx;
  }

  public getName(): string {
    return "Instance";
  }
}
