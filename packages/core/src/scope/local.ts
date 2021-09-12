import { EMPTY_ARRAY, STATIC_CONTEXT } from "../constants";
import { Context, Injector, Session } from "../injector";
import { ForwardRef, InstanceRecord } from "../interfaces";
import { Token } from "../types";
import { resolveRef } from "../utils";
import { ANNOTATIONS } from "../constants"

import { Scope } from "./index";

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

  get name() {
    return 'Local';
  }

  public getContext(session: Session, options: LocalScopeOptions = defaultOptions, injector: Injector): Context {
    const parent = session.parent;

    // if parent session in `undefined` or custom Context is passed treat scope as Transient
    // TODO: rethink the `session.getContext()` case - it's valid in all cases, maybe use should have option to define the custom context for local "scope"
    if (parent === undefined || (options.reuseContext === true && session.getContext())) {
      return Scope.TRANSIENT.getContext(session, options as any, injector);
    }

    // treat scope as with side effects
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

    let ctx: Context = this.instances.get(instance);
    if (ctx === undefined) {
      ctx = new Context();
      this.instances.set(instance, ctx);
    }
    return ctx;
  }

  public onDestroy(): boolean {
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
}
