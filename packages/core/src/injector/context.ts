import { getDeepProperty } from '../utils';

import type { Path, PathValue } from '../types/private';
import type { ContextOptions } from '../types';

// TODO: Add .for() method simialr like Symbol.for()
export class Context<D extends Record<string | symbol, unknown> = Record<string | symbol, unknown>> {
  static STATIC = Context.create(undefined, { name: 'adi:static' });

  static create<T extends Record<string | symbol, unknown> = Record<string | symbol, unknown>>(data: T = {} as T, options?: ContextOptions, meta?: Record<string | symbol, any>): Context<T> {
    return new this(data, options, meta);
  }

  private constructor(
    private readonly data: D = {} as D,
    private readonly options?: ContextOptions,
    public readonly meta: Record<string | symbol, any> = {},
  ) {}

  get(): D;
  get<T = D, P extends Path<T> = any, PV = PathValue<T, P>>(path: P): PV;
  get<T = D, P extends Path<T> = any, PV = PathValue<T, P>>(path?: P): PV | D {
    if (typeof path !== 'string') {
      return this.data as D;
    }
    return getDeepProperty(this.data, path) as PV;
  }
}
