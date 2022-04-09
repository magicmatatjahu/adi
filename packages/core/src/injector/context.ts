import { ADI_INJECTABLE_DEF } from '../constants';
import { SessionFlag } from '../enums';

import type { InjectableDefinition } from '../interfaces';

export class Context<T extends Record<string | symbol, unknown> = Record<string | symbol, unknown>> {
  constructor(
    public readonly data: T = {} as T,
    public readonly name?: string,
  ) {}

  static [ADI_INJECTABLE_DEF]: InjectableDefinition = {
    token: Context,
    options: {
      hooks: [(session) => {
        session.setFlag(SessionFlag.SIDE_EFFECTS);
        const parent = session.parent;
        return parent && parent.ctx.instance?.ctx;
      }],
    },
    injections: {} as any,
    meta: {},
  }
}
