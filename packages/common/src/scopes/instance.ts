import { Context, createScope, Scope, SessionFlag, SingletonScope, TransientScope } from '@adi/core';

import type { ProviderInstance, Session } from '@adi/core';
import type { ForwardReference } from '@adi/core/lib/utils';

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

    const parentInstance = parent.ctx.instance;
    let ctx = this.contexts.get(parentInstance) as Context;
    if (ctx === undefined) {
      ctx = new Context();
      this.contexts.set(parentInstance, ctx);
      this.contexts.set(ctx, parentInstance);
    }
    // session.setFlag(SessionFlag.SIDE_EFFECTS);
    return ctx;
  }

  override canDestroy(session: Session): boolean {
    return false;
    // destroy only on `injector` event and when parents don't exist 
    // return event === 'injector' && (instance.parents === undefined || instance.parents.size === 0);
  };

  override canBeOverrided(session: Session<any>, options: InstanceScopeOptions): boolean {
    return options.canBeOverrided;
  }
}

export default createScope<InstanceScopeOptions>(new InstanceScope(), { reuseContext: true, canBeOverrided: true });
