import { Scope, createScope } from "./scope";
import { InjectionKind, SessionFlag } from "../enums";
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
    // TODO: Handle cicular references between providers with transient scope 

    let ctx = options.reuseContext === true ? session.options.ctx : undefined;
    if (ctx === undefined) {
      ctx = new Context();
      this.contexts.set(ctx, session.metadata);
      session.setFlag(SessionFlag.SIDE_EFFECTS);
    }
    return ctx;
  }

  override canDestroy(instance: ProviderInstance, _: TransientScopeOptions, destroyCtx: DestroyContext): boolean {
    const ctx = instance.ctx;

    // operating on an instance with a context passed by user - destroy only with `injector` event and with no parents
    if (!this.contexts.has(ctx)) {
      return destroyCtx.event === 'injector' && (instance.parents === undefined || instance.parents.size === 0);
    }

    // with no parents
    if (
      instance.parents === undefined || instance.parents.size === 0 ||
      (instance.session.metadata.kind & InjectionKind.METHOD)
    ) {
      this.contexts.delete(ctx);
      return true;
    }

    return false;
  };

  override canBeOverrided(_: Session, options: TransientScopeOptions): boolean {
    return options.canBeOverrided;
  }
}

export default createScope<TransientScopeOptions>(new TransientScope(), { reuseContext: true, canBeOverrided: true });
