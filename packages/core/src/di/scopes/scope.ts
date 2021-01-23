import { InjectionOptions, RecordDefinition, Inquirer } from "../interfaces";
import { Context } from "../tokens";
import { STATIC_CONTEXT } from "../constants";
import { ScopeFlags } from "../enums";

export class Scope {
  public static DEFAULT: Scope;
  public static INSTANCE: Scope;
  public static REQUEST: Scope;
  public static SINGLETON: Scope;
  public static TRANSIENT: Scope;
  public static STRICT_TRANSIENT: Scope;
  
  public readonly flags: ScopeFlags = ScopeFlags.CAN_OVERRIDE;

  public getContext<T = any>(
    options: InjectionOptions,
    def: RecordDefinition<T>, 
    inquirer?: Inquirer,
  ): Context {
    return options.ctx || STATIC_CONTEXT;
  }

  public toCache<T = any>(
    options: InjectionOptions,
    def: RecordDefinition<T>, 
    inquirer?: Inquirer,
  ): boolean {
    return true;
  }

  public getName(): string {
    return "Default";
  }
}
