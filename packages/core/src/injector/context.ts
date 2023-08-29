import { getDeepProperty } from '../utils';

import type { Path, PathValue } from '../types/private';

export class Context<D extends Record<string | symbol, unknown> = Record<string | symbol, unknown>> {
  constructor(
    private readonly data: D = {} as D,
    public readonly name?: string,
    public readonly meta?: any,
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
