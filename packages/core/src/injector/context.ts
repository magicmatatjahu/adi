import { NOOP_FN } from "../constants";
import { ProviderDef } from "../interfaces";
import { Session } from "./session";

export class Context<T = any> {
  constructor(
    private readonly data?: T,
    // for debug purpose
    private readonly name?: string,
  ) {}

  static $$prov: ProviderDef = {
    token: Context,
    factory: NOOP_FN,
    options: {
      provideIn: 'any',
      useWrapper: {
        func: (_, session: Session) => {
          const parent = session.parent;
          if (parent === undefined) {
            throw new Error('Context provider can be only used in other providers');
          }
          session.setSideEffect(true);
          return parent.instance.ctx;
        }
      } as any,
    }
  };
}
