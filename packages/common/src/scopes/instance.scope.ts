import { Context, createScope, Scope, SingletonScope, TransientScope } from '@adi/core';
import { getScopeDefinition } from '@adi/core/lib/scopes';

import type { Session, ProviderInstance, DestroyContext } from '@adi/core';

const singletonDef = getScopeDefinition(SingletonScope)
const transientDef = getScopeDefinition(TransientScope)

export interface InstanceScopeOptions {
  reuseContext?: boolean;
  canBeOverrided?: boolean;
}

export class InstanceScope extends Scope<InstanceScopeOptions> {
  protected contexts = new WeakMap<Context | ProviderInstance, Context | ProviderInstance>();

  override get name(): string {
    return "adi:scope:instance";
  }

  override getContext(session: Session, options: InstanceScopeOptions): Context | Promise<Context> {
    const parent = session.parent;
    if (options.reuseContext === true && session.ctx) {
      const { scope, options } = transientDef;
      return scope!.getContext(session, options!);
    } else if (!parent) {
      const { scope, options } = singletonDef;
      return scope!.getContext(session, options!);
    }
    
    session.setFlag('side-effect');
    const parentInstance = parent.instance!;
    let context = this.contexts.get(parentInstance) as Context | undefined;
    if (context === undefined) {
      context = Context.create();
      this.contexts.set(parentInstance, context);
      this.contexts.set(context, parentInstance);
    }
    return context;
  }

  override shouldDestroy(instance: ProviderInstance, options: InstanceScopeOptions, ctx: DestroyContext): boolean | Promise<boolean> {
    const context = instance.context;
    
    // passed custom context - treat scope as Transient
    if (!this.contexts.has(context)) {
      return transientDef.scope!.shouldDestroy(instance, options, ctx);
    }

    // when no parent
    if (instance.parents === undefined || instance.parents.size === 0) {
      const parentInstance = this.contexts.get(context);
      this.contexts.delete(parentInstance!);
      this.contexts.delete(context);
      return true;
    }

    return false;
  };

  override canBeOverrided(_: Session, options: InstanceScopeOptions): boolean {
    return options.canBeOverrided as boolean;
  }
}

export default createScope<InstanceScopeOptions>(new InstanceScope(), { reuseContext: true, canBeOverrided: true });
