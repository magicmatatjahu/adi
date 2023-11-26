import { createScope } from "./factory";
import { Scope } from "./scope";
import { Context } from "../injector";

import type { Session, ProviderInstance } from "../injector";
import type { DestroyContext } from "../types";

export interface SingletonScopeOptions {}

export class SingletonScope extends Scope<SingletonScopeOptions> {
  override get name(): string {
    return "adi:scope:singleton";
  }

  override getContext(session: Session, options: SingletonScopeOptions): Context {    
    const context = session.ctx;
    if (context && context !== Context.STATIC) {
      throw new Error("Cannot recreate provider with singleton scope");
    }
    return Context.STATIC;
  }

  override shouldDestroy(instance: ProviderInstance, _: SingletonScopeOptions, ctx: DestroyContext): boolean {
    return ctx.event === 'injector' && !instance.parents?.size;
  };

  override canBeOverrided(): boolean {
    return false;
  }
}

export default createScope<SingletonScopeOptions>(new SingletonScope(), {});
