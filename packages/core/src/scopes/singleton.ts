import { Scope, createScope } from "./scope";
import { STATIC_CONTEXT } from "../constants";
import { Context } from "../injector";
import { getHostInjector } from "../utils";
// import { DestroyEvent, InstanceRecord } from "../interfaces";

import type { Injector, Session } from "../injector";

export interface SingletonScopeOptions {
  perInjector?: boolean;
}

export class SingletonScope extends Scope<SingletonScopeOptions> {
  private contexts = new WeakMap<Injector | Context, Injector | Context>();

  override get name(): string {
    return "adi:scope:singleton";
  }

  override getContext(session: Session, options: SingletonScopeOptions): Context {
    if (options.perInjector === true) {
      const hostInjector = getHostInjector(session);
      let ctx = this.contexts.get(hostInjector) as Context;
      if (ctx === undefined) {
        ctx = new Context(STATIC_CONTEXT.data);
        this.contexts.set(hostInjector, ctx);
        this.contexts.set(ctx, hostInjector);
      }
      return ctx;
    }
    
    const ctx = session.options.ctx;
    if (ctx && ctx !== STATIC_CONTEXT) {
      throw new Error("Cannot create provider with singleton scope");
    }
    return STATIC_CONTEXT;
  }

  // public canDestroy(event: DestroyEvent, instance: InstanceRecord): boolean {
  //   // destroy only on `injector` event and when parents don't exist 
  //   return event === 'injector' && (instance.parents === undefined || instance.parents.size === 0);
  // };

  override canBeOverrided(): boolean {
    return false;
  }
}

export default createScope<SingletonScopeOptions>(new SingletonScope(), { perInjector: false });
