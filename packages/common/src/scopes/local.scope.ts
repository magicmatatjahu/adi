import { Context, createScope, Scope, SingletonScope, TransientScope, resolveRef } from '@adi/core';
import { InstanceStatus } from '@adi/core/lib/enums';

import type { Session, ProviderToken, ProviderInstance, DestroyContext, ForwardReference } from '@adi/core';

export interface LocalScopeOptions {
  toToken?: ProviderToken | ForwardReference;
  toScope?: string | symbol;
  /**
   * 1 - nearest
   * Number.POSITIVE_INFINITY - farthest
   */
  depth?: 'nearest' | 'farthest' | number;
  reuseContext?: boolean;
  canBeOverrided?: boolean;
}

export class LocalScope extends Scope<LocalScopeOptions> {
  protected contexts = new WeakMap<Context | ProviderInstance, Context | ProviderInstance>();

  override get name(): string {
    return "adi:scope:local";
  }

  override getContext(session: Session, options: LocalScopeOptions): Context {
    const parent = session.parent;
    if (options.reuseContext === true && session.iOptions.context) {
      return TransientScope.kind.getContext(session, options);
    } else if (!session.parent) {
      return SingletonScope.kind.getContext(session, SingletonScope.options);
    }

    // always treat scope as with side effects
    session.setFlag('side-effect');

    let instance: ProviderInstance;
    const depth = options.depth || 'nearest';
    const toToken = resolveRef(options.toToken) as ProviderToken;
    const toScope = options.toScope;
    if (depth === 'nearest') {
      instance = this.retrieveInstanceByDepth(parent, 1, toToken, toScope);
    } else if (depth === 'farthest') {
      instance = this.retrieveInstanceByDepth(parent, Number.POSITIVE_INFINITY, toToken, toScope);
    } else if (typeof depth === 'number') {
      instance = this.retrieveInstanceByDepth(parent, depth, toToken, toScope);
    }

    // if instance doesn't exist then treat scope as Singleton
    if (!instance) {
      return;
    }

    let context = this.contexts.get(instance) as Context;
    if (!context) {
      context = new Context();
      this.contexts.set(instance, context);
      this.contexts.set(context, instance);
    }
    return context;
  }

  override shouldDestroy(instance: ProviderInstance, options: LocalScopeOptions, destroyCtx: DestroyContext): boolean {
    const context = instance.context;

    // if ctx doesn't exist in the Local scope treat scope as Transient
    if (this.contexts.has(context) === false) {
      return TransientScope.kind.shouldDestroy(instance, options, destroyCtx);
    }

    // when no parent and only when local instance is previously destroyed
    const localInstance = this.contexts.get(context) as ProviderInstance;
    if (!instance.parents?.size) {
      if (localInstance.status & InstanceStatus.DESTROYED) {
        this.contexts.delete(context);
        this.contexts.delete(localInstance);
        return true;
      }

      // Link instances and local instances with references
      // This is the case when a local instance was created dynamically (e.g. by Factory hook with instance with Transient scope in subgraph), 
      // but is not attached to the parent in any way.
      // TODO: Base such a thing on the ADI hooks - not on links
      (localInstance.links || (localInstance.links = new Set())).add(instance);
    }
    return false;
  };

  override canBeOverrided(session: Session<any>, options: LocalScopeOptions): boolean {
    return options.canBeOverrided;
  }

  protected retrieveInstanceByDepth(session: Session, goal: number, toToken: ProviderToken, toScope: string | symbol, depth: number = 0, instance?: ProviderInstance | undefined): ProviderInstance {
    // if depth goal is achieved or parent session doesn't exist
    if (depth === goal || session === undefined) {
      return instance;
    }

    instance = this.retrieveInstance(session, toToken, toScope);
    instance !== undefined && depth++;
    return this.retrieveInstanceByDepth(session.parent, goal, toToken, toScope, depth, instance);
  }

  private retrieveInstance(session: Session, toToken?: ProviderToken, toScope?: string | symbol): ProviderInstance | undefined {
    const context = session.context;
    const isProviderToken = context.provider.token === toToken;
    const annotation = context.definition.annotations.localScope;
    const instance = context.instance;

    // if annotations exists but scope hasn't any options
    if (toScope === undefined && toToken === undefined && annotation !== undefined) {
      return instance;
    }

    const isAnnotation = (annotation || []).includes(toScope);
    if (!isProviderToken && !isAnnotation) {
      return;
    }
    // rest of conditions
    return instance;
  }
}

export default createScope<LocalScopeOptions>(new LocalScope(), {
  toToken: undefined,
  toScope: undefined,
  depth: 'nearest',
  reuseContext: true,
  canBeOverrided: true,
});
