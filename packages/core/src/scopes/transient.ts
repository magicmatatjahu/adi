import { Scope, createScope } from "./scope";
import { Context } from "../injector";
import { isMethodInjection } from "../utils";

import type { Session } from "../injector";
import type { ProviderInstance, InjectionMetadata, DestroyContext } from "../interfaces";

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

    let context = options.reuseContext && session.iOptions.context;
    if (!context) {
      context = new Context();
      this.contexts.set(context, session.iMetadata);
      session.setFlag('side-effect');
    }
    return context;
  }

  override shouldDestroy(instance: ProviderInstance, _: TransientScopeOptions, destroyCtx: DestroyContext): boolean {
    const context = instance.context;
    const noParents = !instance.parents?.size;

    // operating on an instance with a context passed by user - destroy only with `injector` event and with no parents
    if (!this.contexts.has(context)) {
      return destroyCtx.event === 'injector' && noParents;
    }

    // with no parents
    if (noParents || isMethodInjection(instance.session.iMetadata)) {
      this.contexts.delete(context);
      return true;
    }

    return false;
  };

  override canBeOverrided(_: Session, options: TransientScopeOptions): boolean {
    return options.canBeOverrided;
  }
}

export default createScope<TransientScopeOptions>(new TransientScope(), { reuseContext: true, canBeOverrided: true });