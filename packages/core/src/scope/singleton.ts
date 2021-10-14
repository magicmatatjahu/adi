import { Context, Injector, Session } from "../injector";
import { STATIC_CONTEXT } from "../constants";
import { ScopeFlags } from "../enums";

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

  get name() {
    return 'Singleton';
  }

  public getContext(session: Session, options: SingletonScopeOptions = defaultOptions): Context {
    if (options.perInjector === true) {
      const parent = session.parent;

      // `injector.get()` case
      if (parent === undefined) {
        return STATIC_CONTEXT;
      }
      else {
        const parentInjector = parent.record.host;
        let ctx = this.contexts.get(parentInjector);
        if (ctx === undefined) {
          ctx = new Context(STATIC_CONTEXT.get());
          this.contexts.set(parentInjector, ctx);
        }
        return ctx;
      }
    }

    const ctx = session.getContext();
    if (ctx && ctx !== STATIC_CONTEXT) {
      throw new Error("Cannot create provider with singleton scope");
    }
    return STATIC_CONTEXT;
  }

  public canDestroy(event: DestroyEvent, instance: InstanceRecord): boolean {
    // destroy only on `injector` event and when parents don't exist
    return event === 'injector' && (instance.parents === undefined || instance.parents.size === 0);
  }
}
