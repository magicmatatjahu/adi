import { Injector, Context, createScope, Scope, SingletonScope, TransientScope, resolveRef } from '@adi/core';
import { getScopeDefinition } from '@adi/core/lib/scopes';

import type { Session, ProviderToken, ProviderInstance, DestroyContext, ForwardReference } from '@adi/core';

const singletonDef = getScopeDefinition(SingletonScope)
const transientDef = getScopeDefinition(TransientScope)

export interface LocalScopeOptions {
  to?: typeof Injector | ProviderToken | ForwardReference;
  scope?: string | symbol;
  /**
   * 1 - nearest
   * Number.POSITIVE_INFINITY - farthest
   */
  depth?: 'nearest' | 'farthest' | number;
  reuseContext?: boolean;
  canBeOverrided?: boolean;
}

export class LocalScope extends Scope<LocalScopeOptions> {
  protected cache = new WeakMap<Context | ProviderInstance | Injector, Context | ProviderInstance | Injector>();

  override get name(): string {
    return "adi:scope:local";
  }

  override getContext(session: Session, options: LocalScopeOptions): Context | Promise<Context> {
    const parent = session.parent;
    if (options.reuseContext === true && session.ctx) { // reuse context - treat scope as Transient
      const { scope, options } = transientDef;
      return scope!.getContext(session, options!);
    } else if (!parent) { // no parent session - treat scope as Singleton
      const { scope, options } = singletonDef;
      return scope!.getContext(session, options!);
    }

    // always treat scope as with side effect
    session.setFlag('side-effect');

    const toToken = resolveRef(options.to) as ProviderToken;
    const toScope = options.scope;
    const depth = options.depth || 'nearest';
    let properDepth: number | undefined;
    if (depth === 'nearest') {
      properDepth = 1;
    } else if (depth === 'farthest') {
      properDepth = Number.POSITIVE_INFINITY;
    } else {
      properDepth = depth;
    }

    let ref: Injector | ProviderInstance | undefined = undefined;
    if (toToken === Injector) {
      ref = this.retrieveInstanceByInjector(session, properDepth, toScope);
    } else if (parent) {
      ref = this.retrieveInstanceByToken(parent, properDepth, toToken, toScope);
    }

    // if ref doesn't exist then treat scope as Singleton
    if (!ref) {
      return Context.STATIC;
    }

    let context = this.cache.get(ref) as Context;
    if (!context) {
      context = Context.create();
      this.cache.set(ref, context);
      this.cache.set(context, ref);
    }
    return context;
  }

  override shouldDestroy(instance: ProviderInstance, options: LocalScopeOptions, ctx: DestroyContext): boolean | Promise<boolean> {
    const context = instance.context;

    // if ctx doesn't exist in the Local scope treat scope as Transient
    if (this.cache.has(context) === false) {
      return transientDef.scope!.shouldDestroy(instance, options, ctx);
    }

    // when is correlated to the injector
    if (options.to === Injector && ctx.event === 'injector') {
      const noParents = !instance.parents?.size;
      const injector = this.cache.get(context) as Injector;
      if (injector && injector.status & 8 && noParents) {
        this.cache.delete(context);
        this.cache.delete(injector);
        return true;
      }

      return false;
    }

    // when no parent and only when local instance is previously destroyed
    const localInstance = this.cache.get(context) as ProviderInstance;
    if (!instance.parents?.size) {
      if (localInstance.status & 4) {
        this.cache.delete(context);
        this.cache.delete(localInstance);
        return true;
      }

      // Case when a local instance was created dynamically (e.g. by Factory hook with Transient instance in subgraph), but is not attached to the parent in any way.
      localInstance.onDestroy(() => instance.destroy());
    }
    return false;
  };

  override canBeOverrided(_: Session, options: LocalScopeOptions): boolean {
    return options.canBeOverrided as boolean;
  }

  private retrieveInstanceByInjector(session: Session | undefined, goal: number, toScope?: string | symbol, depth: number = 0, injector?: Injector): Injector | undefined {
    // if depth goal is achieved or parent session doesn't exist
    if (depth === goal || session === undefined) {
      return injector;
    }

    const newInjector = this.retrieveInjector(session, toScope);
    newInjector !== undefined && depth++;
    return this.retrieveInstanceByInjector(session.parent, goal, toScope, depth, newInjector || injector);
  }

  protected retrieveInstanceByToken(session: Session | undefined, goal: number, toToken: ProviderToken, toScope: string | symbol | undefined, depth: number = 0, instance?: ProviderInstance | undefined): ProviderInstance | undefined {
    // if depth goal is achieved or parent session doesn't exist
    if (depth === goal || session === undefined) {
      return instance;
    }

    const newInstance = this.retrieveInstance(session, toToken, toScope);
    newInstance !== undefined && depth++;
    return this.retrieveInstanceByToken(session.parent, goal, toToken, toScope, depth, newInstance || instance);
  }

  private retrieveInjector(session: Session, toScope?: string | symbol): Injector | undefined {
    const scopes = session.host.options.scopes;

    // if scope doesn't exist
    if (toScope === undefined) {
      return session.host
    }

    const isInScope = scopes!.includes(toScope);
    if (!isInScope) {
      return;
    }

    // rest of conditions
    return session.host;
  }

  private retrieveInstance(session: Session, toToken?: ProviderToken, toScope?: string | symbol): ProviderInstance | undefined {
    const isProviderToken = session.provider?.token === toToken;
    const annotation = session.definition?.annotations.localScope;

    // if annotations exists but scope hasn't any options
    if (toScope === undefined && toToken === undefined && annotation !== undefined) {
      return session.instance;
    }

    const isAnnotation = (annotation || []).includes(toScope);
    if (!isProviderToken && !isAnnotation) {
      return;
    }

    // rest of conditions
    return session.instance;
  }
}

export default createScope<LocalScopeOptions>(new LocalScope(), {
  to: undefined,
  scope: undefined,
  depth: 'nearest',
  reuseContext: true,
  canBeOverrided: true,
});
