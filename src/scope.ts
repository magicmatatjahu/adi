import { Context } from "./injector";
import { DefinitionRecord, InjectionSession } from "./interfaces";
import { STATIC_CONTEXT } from "./constants";
import { ScopeFlags } from "./enums";

export class Scope {
  public readonly flags: ScopeFlags = ScopeFlags.CAN_OVERRIDE;

  public static DEFAULT: Scope = new Scope();
  public static SINGLETON: Scope = undefined;
  public static TRANSIENT: Scope = undefined;

  public name = "Default";

  public getContext<T = any>(
    def: DefinitionRecord<T>, 
    session?: InjectionSession,
  ): Context {
    return session?.options?.ctx || STATIC_CONTEXT;
  }

  // public toCache<T = any>(
  //   options: InjectionOptions,
  //   def: RecordDefinition<T>, 
  //   session?: InjectionSession,
  // ): boolean {
  //   return true;
  // }
}

export class SingletonScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.NONE;

  public name = "Singleton";

  public getContext(def: DefinitionRecord, session: InjectionSession): Context {
    if (session.options.ctx !== STATIC_CONTEXT) {
      // todo: change to warning
      throw new Error("Cannot create provider with singleton scope");
    }
    return STATIC_CONTEXT;
  }
}
Scope.SINGLETON = new SingletonScope();

export class TransientScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.CAN_OVERRIDE;

  public name = "Transient";

  getContext(def: DefinitionRecord, session: InjectionSession): Context {
    if (session.parent && def === session.parent.instance.def) {
      throw Error("Cannot inject new instance of itself class (with TRANSIENT scope)");
    }
    let ctx = session.options.ctx;
    if (!ctx) {
      ctx = new Context();
    }
    return ctx;
  }
}
Scope.TRANSIENT = new TransientScope();
