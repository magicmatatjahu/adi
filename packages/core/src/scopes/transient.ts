import { Scope, createScope } from "./scope";
import { SessionFlag } from "../enums";
import { Context } from "../injector";

import type { Session, DestroyContext } from "../injector";
import type { ProviderInstance, InjectionMetadata } from "../interfaces";

export interface TransientScopeOptions {
  reuseContext?: boolean;
  canBeOverrided?: boolean;
}

export class TransientScope extends Scope<TransientScopeOptions> {
  protected contexts = new WeakMap<Context, InjectionMetadata>();

  override get name(): string {
    return "adi:scope:transient"
  }

  override getContext(session: Session, options: TransientScopeOptions): Context {
    // const parent = session.parent;
    // if (
    //   parent &&
    //   parent.parent &&
    //   parent.ctx.instance.scope.scope instanceof TransientScope &&
    //   session.definition === parent.parent.ctx.def
    // ) {
    //   throw Error("Circular injections are not allowed between providers with Transient scope. If required, create a new instance with the specified context.");
    // }

    let ctx = options.reuseContext === true ? session.options.ctx : undefined;
    if (ctx === undefined) {
      ctx = new Context();
      this.contexts.set(ctx, session.metadata);
      session.setFlag(SessionFlag.SIDE_EFFECTS);
    }
    return ctx;
  }

  override canDestroy(instance: ProviderInstance, _: TransientScopeOptions, ctx: DestroyContext): boolean {
    return false;
    // destroy only on `injector` event and when parents don't exist 
    // return event === 'injector' && (instance.parents === undefined || instance.parents.size === 0);
  };

  override canBeOverrided(_: Session, options: TransientScopeOptions): boolean {
    return options.canBeOverrided;
  }
}

export default createScope<TransientScopeOptions>(new TransientScope(), { reuseContext: true, canBeOverrided: true });
