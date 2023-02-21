import { Context, createScope, Scope, SingletonScope, TransientScope } from '@adi/core';

import type { Session, ProviderInstance, DestroyContext } from '@adi/core';

export interface InstanceScopeOptions {
  reuseContext?: boolean;
  canBeOverrided?: boolean;
}

export class InstanceScope extends Scope<InstanceScopeOptions> {
  protected contexts = new WeakMap<Context | ProviderInstance, Context | ProviderInstance>();

  override get name(): string {
    return "adi:scope:instance";
  }

  override getContext(session: Session, options: InstanceScopeOptions): Context {
    const parent = session.parent;
    if (options.reuseContext === true && session.iOptions.context) {
      return TransientScope.kind.getContext(session, options);
    } else if (!parent) {
      return SingletonScope.kind.getContext(session, SingletonScope.options);
    }
    
    session.setFlag('side-effect');
    const parentInstance = parent.context.instance;
    let context = this.contexts.get(parentInstance) as Context;
    if (context === undefined) {
      context = new Context();
      this.contexts.set(parentInstance, context);
      this.contexts.set(context, parentInstance);
    }
    return context;
  }

  override shouldDestroy(instance: ProviderInstance, options: InstanceScopeOptions, destroyCtx: DestroyContext): boolean {
    const context = instance.context;
    
    // passed custom context - treat scope as Transient
    if (!this.contexts.has(context)) {
      return TransientScope.kind.shouldDestroy(instance, options, destroyCtx);
    }

    // when no parent
    if (instance.parents === undefined || instance.parents.size === 0) {
      const parentInstance = this.contexts.get(context);
      this.contexts.delete(parentInstance);
      this.contexts.delete(context);
      return true;
    }

    return false;
  };

  override canBeOverrided(session: Session<any>, options: InstanceScopeOptions): boolean {
    return options.canBeOverrided;
  }
}

export default createScope<InstanceScopeOptions>(new InstanceScope(), { reuseContext: true, canBeOverrided: true });
