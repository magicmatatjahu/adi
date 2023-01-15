import { Scope, createScope } from "./scope";
import { STATIC_CONTEXT } from "../constants";
import { InjectorStatus } from "../enums";
import { Context } from "../injector";
import { getHostInjector } from "../injector/metadata";

import type { Injector, Session } from "../injector";
import type { ProviderInstance, DestroyContext } from "../interfaces";

export interface SingletonScopeOptions {
  perInjector?: boolean;
}

export class SingletonScope extends Scope<SingletonScopeOptions> {
  protected perInjectors = new WeakMap<Injector | Context, Injector | Context>();

  override get name(): string {
    return "adi:scope:singleton";
  }

  override getContext(session: Session, options: SingletonScopeOptions): Context {
    if (options.perInjector) {
      const hostInjector = getHostInjector(session);
      let context = this.perInjectors.get(hostInjector) as Context;
      if (context === undefined) {
        context = new Context(STATIC_CONTEXT.get());
        this.perInjectors.set(hostInjector, context);
        this.perInjectors.set(context, hostInjector);
      }
      return context;
    }
    
    const context = session.iOptions.context;
    if (context && context !== STATIC_CONTEXT) {
      throw new Error("Cannot recreate provider with singleton scope");
    }
    return STATIC_CONTEXT;
  }

  override shouldDestroy(instance: ProviderInstance, options: SingletonScopeOptions, destroyCtx: DestroyContext): boolean {
    const noParents = !instance.parents?.size;
    
    if (!options.perInjector) {
      return destroyCtx.event === 'injector' && noParents;
    }
    
    const context = instance.context;
    const injector = this.perInjectors.get(context) as Injector;
    if (injector && injector.status & InjectorStatus.DESTROYED && noParents) {
      this.perInjectors.delete(context);
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