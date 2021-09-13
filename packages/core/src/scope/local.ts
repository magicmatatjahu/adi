import { EMPTY_ARRAY, STATIC_CONTEXT } from "../constants";
import { Context, Injector, Session } from "../injector";
import { DestroyEvent, ForwardRef, InstanceRecord } from "../interfaces";
import { Token } from "../types";
import { resolveRef } from "../utils";
import { ANNOTATIONS } from "../constants"

import { Scope } from "./index";
import { InstanceStatus } from "../enums";

export interface LocalScopeOptions {
  toToken?: Token | ForwardRef;
  toScope?: string | symbol;
  customAnnotation?: string | symbol;
  /**
   * 1 - nearest
   * Number.POSITIVE_INFINITY - farthest
   */
  depth?: 'nearest' | 'farthest' | number;
  reuseContext?: boolean;
}

const defaultOptions: LocalScopeOptions = {
  toToken: undefined,
  toScope: undefined,
  customAnnotation: undefined,
  depth: 'nearest',
  reuseContext: true,
}

export class LocalScope extends Scope<LocalScopeOptions> {
  private instances = new WeakMap<InstanceRecord, Context>();
  private contexts = new WeakMap<Context, InstanceRecord>();

  get name() {
    return 'Local';
  }

  public getContext(session: Session, options: LocalScopeOptions = defaultOptions, injector: Injector): Context {
    options = this.mergeOptions(options);
    const parent = session.parent;

    // if parent session in `undefined` or custom Context is passed treat scope as Transient
    // TODO: Maybe if parent session in `undefined` then it should be terated as Singleton scope rather than Transient scope...
    if (parent === undefined || (options.reuseContext === true && session.getContext())) {
      return Scope.TRANSIENT.getContext(session, options as any, injector);
    }

    // always treat scope as with side effects
    session.setSideEffect(true);

    let instance: InstanceRecord;
    const depth = options.depth || 'nearest';
    const toToken = resolveRef(options.toToken) as Token;
    const toScope = options.toScope;
    const toAnnotation = options.customAnnotation || ANNOTATIONS.LOCAL_SCOPE;
    if (depth === 'nearest') {
      instance = this.retrieveInstanceByDepth(parent, 1, toToken, toScope, toAnnotation);
    } else if (depth === 'farthest') {
      instance = this.retrieveInstanceByDepth(parent, Number.POSITIVE_INFINITY, toToken, toScope, toAnnotation);
    } else if (typeof depth === 'number') {
      instance = this.retrieveInstanceByDepth(parent, depth, toToken, toScope, toAnnotation);
    }

    // if instance doesn't exist then treat scope as Singleton
    if (instance === undefined) {
      return STATIC_CONTEXT;
    }

    let ctx = this.instances.get(instance);
    if (ctx === undefined) {
      ctx = new Context();
      this.instances.set(instance, ctx);
      this.contexts.set(ctx, instance);
    }
    return ctx;
  }

  public canDestroy(
    event: DestroyEvent,
    instance: InstanceRecord,
    options: LocalScopeOptions = defaultOptions,
    injector: Injector,
  ): boolean {
    options = this.mergeOptions(options);
    const ctx = instance.ctx;

    // if ctx doesn't exist in the Local scope treat scope as Transient
    if (this.contexts.has(ctx) === false) {
      return Scope.TRANSIENT.canDestroy(event, instance, options, injector);
    }

    // when no parent and only when local instance is previously destroyed
    const localInstance = this.contexts.get(ctx);
    if (instance.parents === undefined || instance.parents.size === 0) {
      if (localInstance.status & InstanceStatus.DESTROYED) {
        this.instances.delete(localInstance);
        this.contexts.delete(ctx);
        return true;
      }
      // Link instances and local instances with references
      // the case when a local instance was created dynamically (e.g. by Factory wrapper with instance with Transient scope in subgraph), but is not attached to the parent in any way.
      (localInstance.children || (localInstance.children = new Set())).add(instance);
      (instance.parents || (instance.parents = new Set())).add(localInstance);
    }

    return false;
  };

  private retrieveInstanceByDepth(session: Session, goal: number, toToken: Token, toScope: string | symbol, toAnnotation: string | symbol, depth: number = 0, instance?: InstanceRecord | undefined): InstanceRecord | undefined {
    // if depth goal is achieved or parent session doesn't exist
    if (depth === goal || session === undefined) {
      return instance;
    }

    instance = this.retrieveInstance(session, toAnnotation, toToken, toScope);
    if (instance !== undefined) {
      depth++;
    }

    return this.retrieveInstanceByDepth(session.parent, goal, toToken, toScope, toAnnotation, depth, instance);
  }

  private retrieveInstance(session: Session, toAnnotation: string | symbol, toToken?: Token, toScope?: string | symbol): InstanceRecord | undefined {
    const isRecordToken = session.record.token === toToken;
    const annotation = session.definition.annotations[toAnnotation as any];
    const isAnnotation = (annotation || EMPTY_ARRAY).includes(toScope);

    // if annotations exists but scope hasn't any options
    if (toScope === undefined && toToken === undefined && annotation !== undefined) {
      return session.instance;
    }
    if (isRecordToken === false && isAnnotation === false) {
      return undefined;
    }
    if (isRecordToken === true && toScope === undefined) {
      return session.instance;
    }
    if (isAnnotation === true && toToken === undefined) {
      return session.instance;
    }
    // isRecordToken === true && isAnnotation === true
    return session.instance;
  }

  private mergeOptions(options: LocalScopeOptions): LocalScopeOptions {
    return options === defaultOptions ? defaultOptions : { ...defaultOptions, ...options };
  }
}
