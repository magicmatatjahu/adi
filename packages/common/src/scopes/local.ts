import { Context, createScope, InstanceStatus, Scope, SessionFlag, SingletonScope, TransientScope, resolveRef } from '@adi/core';

import type { Session, ProviderToken, ProviderInstance } from '@adi/core';
import type { ForwardReference } from '@adi/core/lib/utils';
import type { DestroyContext } from '@adi/core/lib/injector';

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

    if (options.reuseContext === true && session.options.ctx) {
      return TransientScope.kind.getContext(session, options);
    } else if (!session.parent) {
      return SingletonScope.kind.getContext(session, SingletonScope.options);
    }

    // always treat scope as with side effects
    session.setFlag(SessionFlag.SIDE_EFFECTS);
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
    if (instance === undefined) {
      return;
    }

    let ctx = this.contexts.get(instance) as Context;
    if (ctx === undefined) {
      ctx = new Context();
      this.contexts.set(instance, ctx);
      this.contexts.set(ctx, instance);
    }
    return ctx;
  }

  override canDestroy(instance: ProviderInstance, options: LocalScopeOptions, destroyCtx: DestroyContext): boolean {
    const ctx = instance.ctx;

    // if ctx doesn't exist in the Local scope treat scope as Transient
    if (this.contexts.has(ctx) === false) {
      return TransientScope.kind.canDestroy(instance, options, destroyCtx);
    }

    // when no parent and only when local instance is previously destroyed
    const localInstance = this.contexts.get(ctx) as ProviderInstance;
    if (instance.parents === undefined || instance.parents.size === 0) {
      if (localInstance.status & InstanceStatus.DESTROYED) {
        this.contexts.delete(ctx);
        this.contexts.delete(localInstance);
        return true;
      }
      // Link instances and local instances with references
      // the case when a local instance was created dynamically (e.g. by Factory wrapper with instance with Transient scope in subgraph), but is not attached to the parent in any way.
      (localInstance.children || (localInstance.children = new Set())).add(instance);
      (instance.parents || (instance.parents = new Set())).add(localInstance);
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
    const ctx = session.ctx;
    const isRecordToken = ctx.record.token === toToken;
    const annotation = ctx.def.annotations['adi:local-scope'];
    const instance = ctx.instance;

    // if annotations exists but scope hasn't any options
    if (toScope === undefined && toToken === undefined && annotation !== undefined) {
      return instance;
    }

    const isAnnotation = (annotation || []).includes(toScope);
    if (isRecordToken === false && isAnnotation === false) {
      return undefined;
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
