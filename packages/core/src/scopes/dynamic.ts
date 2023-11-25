
import { Context } from "../injector";
import { createScope } from "./factory";
import { Scope } from "./scope";

import type { Session } from "../injector";

export interface DynamicScopeOptions {
  canBeOverrided?: boolean;
}

export class DynamicScope extends Scope<DynamicScopeOptions> {
  protected contexts = new WeakMap<object, Context>();

  override get name(): string {
    return "adi:scope:dynamic";
  }

  override get isDynamic(): boolean {
    return true
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

  override shouldDestroy(): boolean {
    return true;
  };

  override canBeOverrided(_: Session, options: DynamicScopeOptions): boolean {
    return options.canBeOverrided as boolean;
  }
}

export default createScope<DynamicScopeOptions>(new DynamicScope(), { canBeOverrided: true });
