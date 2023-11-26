import { Context } from "../injector";
import { createScope } from "./factory";
import { Scope } from "./scope";

import type { ProviderInstance, Session } from "../injector";

export interface DynamicScopeOptions {
  canBeOverrided?: boolean;
}

export class DynamicScope extends Scope<DynamicScopeOptions> {
  protected contexts = new WeakMap<object, Context>();

  override get name(): string {
    return "adi:scope:dynamic";
  }

  override getContext(session: Session): Context {
    session.setFlag('side-effect');

    const dataCtx = session.dynamicCtx;
    if (typeof dataCtx !== 'object') {
      throw new Error('Dynamic scope needs "ctx" data passed.')
    }

    let ctx = this.contexts.get(dataCtx);
    if (ctx) {
      return ctx;
    }

    this.contexts.set(dataCtx, ctx = Context.create(dataCtx));
    return ctx;
  }

  override shouldDestroy(instance: ProviderInstance): boolean {
    this.contexts.delete(instance.session.dynamicCtx || {});
    return true;
  };

  override canBeOverrided(_: Session, options: DynamicScopeOptions): boolean {
    return options.canBeOverrided as boolean;
  }

  override isDynamic(): boolean {
    return true
  }
}

export default createScope<DynamicScopeOptions>(new DynamicScope(), { canBeOverrided: true });
