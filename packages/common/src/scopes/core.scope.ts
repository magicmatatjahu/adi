import { InjectionOptions, InjectionRecord, Context, Scope, STATIC_CONTEXT } from "@adi/core";

export class CoreScope extends Scope {
  public readonly canOverride: boolean = false;

  public getContext(options: InjectionOptions, record: InjectionRecord): Context {
    if (record.hostInjector.getScope() === "core") {
      throw new Error("Cannot create provider with singleton scope");
    }

    const ctx = options.ctx || STATIC_CONTEXT;
    if (ctx !== STATIC_CONTEXT || options.scope !== undefined) {
      throw new Error("Cannot create provider with singleton scope");
    }
    return ctx;
  }

  public getName(): string {
    return "Core";
  }
}
