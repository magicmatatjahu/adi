import { Context, createScope, Scope, SessionFlag, SingletonScope, TransientScope } from '@adi/core';

import type { Session, ProviderInstance } from '@adi/core';
import type { DestroyContext } from '@adi/core/lib/injector';

export interface InstanceScopeOptions {
  reuseContext?: boolean;
  canBeOverrided?: boolean;
}

export class InstanceScope extends Scope<InstanceScopeOptions> {
  private contexts = new WeakMap<Context | ProviderInstance, Context | ProviderInstance>();

  override get name(): string {
    return "adi:scope:instance";
  }

  override getContext(session: Session, options: InstanceScopeOptions): Context {
    const parent = session.parent;
    if (options.reuseContext === true && session.options.ctx) {
      return TransientScope.kind.getContext(session, options);
    } else if (!parent) {
      return SingletonScope.kind.getContext(session, SingletonScope.options);
    }
    session.setFlag(SessionFlag.SIDE_EFFECTS);

    const parentInstance = parent.ctx.instance;
    let ctx = this.contexts.get(parentInstance) as Context;
    if (ctx === undefined) {
      ctx = new Context();
      this.contexts.set(parentInstance, ctx);
      this.contexts.set(ctx, parentInstance);
    }
    return ctx;
  }

  override canDestroy(instance: ProviderInstance, options: InstanceScopeOptions, destroyCtx: DestroyContext): boolean {
    const ctx = instance.ctx;
    
    // passed custom context - treat scope as Transient
    if (this.contexts.has(ctx) === false) {
      return TransientScope.kind.canDestroy(instance, options, destroyCtx);
    }

    // when no parent
    if (instance.parents === undefined || instance.parents.size === 0) {
      const parentInstance = this.contexts.get(ctx);
      this.contexts.delete(parentInstance);
      this.contexts.delete(ctx);
      return true;
    }

    return false;
  };

  override canBeOverrided(session: Session<any>, options: InstanceScopeOptions): boolean {
    return options.canBeOverrided;
  }
}

export default createScope<InstanceScopeOptions>(new InstanceScope(), { reuseContext: true, canBeOverrided: true });
