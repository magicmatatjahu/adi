import { Context, createScope, Scope, wait } from '@adi/core';

import type { Session, ProviderDefinition, ProviderInstance } from '@adi/core';

type PoolContext = {
  capacity: number;
  created: number;
  free: Array<Context>;
}

export interface OnPool {
  onGetFromPool?(): void | Promise<void>;
  onReturnToPool?(): void | Promise<void>;
}

export interface PooledScopeOptions {
  capacity?: number;
  canBeOverrided?: boolean;
}

const poolMetaKey = 'adi:key:pool';

function hasOnGetFromPool(instance: unknown): instance is { onGetFromPool: () => void | Promise<void> } {
  return Boolean(instance && typeof (instance as OnPool).onGetFromPool === 'function');
}

function hasOnReturnToPool(instance: unknown): instance is { onReturnToPool: () => void | Promise<void> } {
  return Boolean(instance && typeof (instance as OnPool).onReturnToPool === 'function');
}

export class PooledScope extends Scope<PooledScopeOptions> {
  protected pools = new WeakMap<ProviderDefinition, PoolContext>();

  override get name(): string {
    return "adi:pooled";
  }

  override getContext(session: Session, options: PooledScopeOptions): Context | Promise<Context> {
    const definition = session.context.definition as ProviderDefinition;
    const pool = this.getPool(definition, options);
    
    // get context from the beginning - pool should behaves as fifo queue, first in first out
    let maybePromise: Promise<void> | void | undefined;
    let context = pool.free.shift();
    if (!context) {
      if (pool.capacity === pool.created) {
        context = Context.create(undefined, undefined, { [poolMetaKey]: 'redundant' });
      } else {
        pool.created++;
        context = Context.create(undefined, undefined, { [poolMetaKey]: 'default' });
      }
    } else {
      const value = definition.values.get(context)?.value;
      if (hasOnGetFromPool(value)) {
        maybePromise = value.onGetFromPool();
      }
    }

    session.setFlag('side-effect');
    if (maybePromise) {
      return wait(
        maybePromise,
        () => context as Context,
      );
    }
    return context;
  }

  override async shouldDestroy(instance: ProviderInstance): Promise<boolean> {
    const { context, definition, value } = instance;
    const pool = this.pools.get(definition);
    if (!pool) {
      return false;
    }

    let shouldDestroy: boolean = false;
    if (context.meta[poolMetaKey] === 'redundant') {
      shouldDestroy = true;
    } else {
      pool.free.push(context);
    }

    if (hasOnReturnToPool(value)) {
      await value.onReturnToPool();
    }
    return shouldDestroy;
  };

  override canBeOverrided(_: Session, options: PooledScopeOptions): boolean {
    return options.canBeOverrided as boolean;
  }

  protected getPool(definition: ProviderDefinition, options: PooledScopeOptions): PoolContext {
    let pool = this.pools.get(definition);
    if (!pool) {
      pool = {
        capacity: options.capacity || 10,
        created: 0,
        free: [],
      }
      this.pools.set(definition, pool);
    }
    return pool;
  }
}

export default createScope<PooledScopeOptions>(new PooledScope(), { canBeOverrided: true, capacity: 10 });
