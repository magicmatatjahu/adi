import { EMPTY_ARRAY, STATIC_CONTEXT } from "../constants";
import { Context, Injector, Session } from "../injector";
import { ForwardRef, InstanceRecord } from "../interfaces";
import { Token } from "../types";

import { Scope } from "./index";

type LocalScopeOptions = {
  toToken: Token | ForwardRef;
  toScope?: string | symbol;
  depth?: 'nearest' | 'farthest' | number;
} | {
  toScope: string | symbol;
  depth?: 'nearest' | 'farthest' | number;
}

const defaultOptions: LocalScopeOptions = {
  toToken: undefined,
  // remove it
  toScope: 'test',
  depth: 'farthest',
}

/**
 * Add fallback to the checked first `$$local.scope` if isn't defined as option
 */

export class LocalScope extends Scope<LocalScopeOptions> {
  private instances = new Map<InstanceRecord, Context>();

  get name() {
    return 'Local';
  }

  public getContext(session: Session, injector: Injector, options: LocalScopeOptions = defaultOptions): Context {
    const parent = session.getParent();

    // if parent session in `undefined` or custom Context exists treat scope as Transient
    // TODO: rethink the `session.getContext()` case - it's valid in all cases, maybe use should have option to define the custom context for local "scope"
    if (parent === undefined || session.getContext()) {
      return Scope.TRANSIENT.getContext(session, injector);
    }

    // treat scope as with side effects
    session.setSideEffect(true);

    let instance: InstanceRecord;
    const depth = options.depth || 'nearest';
    const toToken = (options as any).toToken;
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
      return STATIC_CONTEXT;
    }

    let ctx: Context = this.instances.get(instance);
    if (ctx === undefined) {
      ctx = new Context();
      this.instances.set(instance, ctx);
    }
    return ctx;
  }

  // TODO: implement and test it
  private retrieveInstanceByDepth(session: Session, goal: number, toToken: Token, toScope: string | symbol, depth: number = 0, instance?: InstanceRecord | undefined): InstanceRecord | undefined {
    // if depth goal is achieved or parent session doesn't exist
    if (depth === goal || session === undefined) {
      return instance;
    }

    instance = this.retrieveInstance(session, toToken, toScope);
    if (instance !== undefined) {
      depth++;
    }

    return this.retrieveInstanceByDepth(session.parent, goal, toToken, toScope, depth, instance);
  }

  private retrieveInstance(session: Session, toToken?: Token, toScope?: string | symbol): InstanceRecord | undefined {
    const isRecordToken = session.record.token === toToken;
    const isAnnotation = (session.definition.annotations['$$local.scope'] || EMPTY_ARRAY).includes(toScope);

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
