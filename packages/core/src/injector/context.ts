import { ADI_INJECTABLE_DEF } from '../constants';
import { SessionFlag } from '../enums';

import type { InjectableDefinition } from '../interfaces';

const circularInjectableDefSymbol = Symbol.for('adi:definition:injectable');

export class Context<T extends Record<string | symbol, unknown> = Record<string | symbol, unknown>> {
  constructor(
    public readonly data: T = {} as T,
    public readonly name?: string,
  ) {}

  static [circularInjectableDefSymbol]: InjectableDefinition = {
    token: Context,
    status: 'full', // TODO: Change name for it
    options: {
      hooks: [(session) => {
        session.setFlag(SessionFlag.SIDE_EFFECTS);
        const parent = session.parent;
        return parent && parent.ctx.instance?.ctx;
      }],
      annotations: {
        'adi:provide-in': 'any',
      }
    },
    injections: {} as any,
    meta: {},
  }
}
