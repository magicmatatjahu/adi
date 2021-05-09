import { Context } from "./injector";
import { DefinitionRecord, InjectionSession, InstanceRecord } from "./interfaces";
import { STATIC_CONTEXT } from "./constants";
import { ScopeFlags } from "./enums";

export class Scope {
  public readonly flags: ScopeFlags = ScopeFlags.CAN_OVERRIDE;

  public static DEFAULT: Scope = new Scope();
  public static SINGLETON: Scope = undefined;
  public static TRANSIENT: Scope = undefined;
  public static INSTANCE: Scope = undefined;

  public name = "Default";

  public getContext<T = any>(
    _: DefinitionRecord<T>, 
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

  public canBeOverrided(): boolean {
    return (this.flags & ScopeFlags.CAN_OVERRIDE) === ScopeFlags.CAN_OVERRIDE;
  }

  public hasSideEffects(): boolean {
    return (this.flags & ScopeFlags.SIDE_EFFECTS) === ScopeFlags.SIDE_EFFECTS;
  }
}

export class SingletonScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.NONE;

  public name = "Singleton";

  public getContext(_: DefinitionRecord, session: InjectionSession): Context {
    const ctx = session.options.ctx;
    if (ctx && ctx !== STATIC_CONTEXT) {
      // todo: change to warning
      throw new Error("Cannot create provider with singleton scope");
    }
    return STATIC_CONTEXT;
  }
}
Scope.SINGLETON = new SingletonScope();

export class TransientScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.CAN_OVERRIDE | ScopeFlags.SIDE_EFFECTS;

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

export class InstanceScope extends Scope {
  public readonly flags: ScopeFlags = ScopeFlags.CAN_OVERRIDE | ScopeFlags.SIDE_EFFECTS;

  public name = "Instance";

  private instances = new Map<InstanceRecord, Context>();

  getContext(def: DefinitionRecord, session: InjectionSession): Context {
    const parentSession = session.parent;
    // if parent session in undefined treat scope as Transient
    if (parentSession === undefined) {
      return Scope.TRANSIENT.getContext(def, session);
    }

    const instance = parentSession.instance;
    let ctx: Context = undefined;
    if ((ctx = this.instances.get(instance)) === undefined) {
      ctx = new Context();
      this.instances.set(instance, ctx);
    }
    return ctx;
  }
}
Scope.INSTANCE = new InstanceScope();
