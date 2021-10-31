import { Context, Injector, Session } from "../injector";
import { STATIC_CONTEXT } from "../constants";
import { InjectorStatus, ScopeFlags } from "../enums";

import { Scope } from "./index";
import { DestroyEvent, InstanceRecord } from "../interfaces";

export interface SingletonScopeOptions {
  perInjector?: boolean;
}

const defaultOptions: SingletonScopeOptions = {
  perInjector: false
}

export class SingletonScope extends Scope<SingletonScopeOptions> {
  public readonly flags: ScopeFlags = ScopeFlags.CANNOT_OVERRIDE;
  
  private contexts = new WeakMap<Injector, Context>();
  private injectors = new WeakMap<Context, Injector>();

  get name() {
    return 'Singleton';
  }

  public getContext(session: Session, options: SingletonScopeOptions = defaultOptions): Context {
    if (options.perInjector === true) {
      const hostInjector = session.getHost();
      let ctx = this.contexts.get(hostInjector);
      if (ctx === undefined) {
        ctx = new Context(STATIC_CONTEXT.get());
        this.contexts.set(hostInjector, ctx);
        this.injectors.set(ctx, hostInjector);
      }
      return ctx;
    }

    const ctx = session.getContext();
    if (ctx && ctx !== STATIC_CONTEXT) {
      throw new Error("Cannot create provider with singleton scope");
    }
    return STATIC_CONTEXT;
  }

  public canDestroy(event: DestroyEvent, instance: InstanceRecord, options: SingletonScopeOptions = defaultOptions): boolean {
    if (options.perInjector) {
      const injector = this.injectors.get(instance.ctx);
      if (injector && injector.status & InjectorStatus.DESTROYED && (instance.parents === undefined || instance.parents.size === 0)) {
        this.injectors.delete(instance.ctx);
        this.contexts.delete(injector);
        return true;
      }
      return false;
    }
    return event === 'injector' && (instance.parents === undefined || instance.parents.size === 0);
  }
}
