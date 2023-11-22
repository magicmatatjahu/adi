import { INJECTABLE_DEF } from '../constants';
import { Hook } from '../hooks';

import type { ContextData, ContextOptions, ContextMetadata, InjectableDef } from '../types';

const contextsRegistry: Map<string | symbol, Context> = new Map();

export class Context<D extends ContextData = ContextData> {
  static [INJECTABLE_DEF]: InjectableDef = {
    provideIn: 'any',
    hooks: [
      Hook(session => {
        session.setFlag('side-effect');
        const parent = session.parent;
        if (parent) {
          return parent.instance?.context;
        }
        return session.instance?.context;
      }),
    ] 
  };

  static STATIC = this.for('adi:static');
  static DYNAMIC = this.for('adi:dynamic');

  static create<T extends ContextData>(data: ContextData = {} as T, options?: ContextOptions, meta?: ContextMetadata): Context<T> {
    return new this(data as any, options, meta);
  }

  static for(name: string | symbol): Context {
    let ctx = contextsRegistry.get(name);
    if (!ctx) {
      const options = typeof name === 'string' ? { name } : undefined;
      contextsRegistry.set(name, ctx = this.create(undefined, options));
    }
    return ctx;
  }

  protected constructor(
    public readonly data: D = {} as D,
    protected readonly options?: ContextOptions,
    public readonly meta: ContextMetadata = {},
  ) {}
}
