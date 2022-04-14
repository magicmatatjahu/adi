import { Scope, createScope } from "./scope";
import { default as DefaultScope } from "./default";
import { STATIC_CONTEXT } from "../constants";
import { InjectorStatus } from "../enums";
import { Context, getHostInjector } from "../injector";

import type { Injector, Session, DestroyContext } from "../injector";

export interface SingletonScopeOptions {
  perInjector?: boolean;
}

export class SingletonScope extends Scope<SingletonScopeOptions> {
  protected perInjectors = new WeakMap<Injector | Context, Injector | Context>();

  override get name(): string {
    return "adi:scope:singleton";
  }

  override getContext(session: Session, options: SingletonScopeOptions): Context {
    if (options.perInjector === true) {
      const hostInjector = getHostInjector(session);
      let ctx = this.perInjectors.get(hostInjector) as Context;
      if (ctx === undefined) {
        ctx = new Context(STATIC_CONTEXT.data);
        this.perInjectors.set(hostInjector, ctx);
        this.perInjectors.set(ctx, hostInjector);
      }
      return ctx;
    }
    
    const ctx = session.options.ctx;
    if (ctx && ctx !== STATIC_CONTEXT) {
      throw new Error("Cannot create provider with singleton scope");
    }
    return STATIC_CONTEXT;
  }

  override canDestroy(session: Session, options: SingletonScopeOptions, ctx: DestroyContext): boolean {
    if (!options.perInjector) {
      return DefaultScope.kind.canDestroy(session, options, ctx);
    }
    
    const instance = session.ctx.instance;
    const injector = this.perInjectors.get(instance.ctx) as Injector;
    if (injector && injector.status & InjectorStatus.DESTROYED && (instance.parents === undefined || instance.parents.size === 0)) {
      this.perInjectors.delete(instance.ctx);
      this.perInjectors.delete(injector);
      return true;
    }
    return false;
  };

  override canBeOverrided(): boolean {
    return false;
  }
}

export default createScope<SingletonScopeOptions>(new SingletonScope(), { perInjector: false });
