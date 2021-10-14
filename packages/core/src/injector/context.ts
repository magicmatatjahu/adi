import { ProviderDef } from "../interfaces";
import { Session } from "./session";

export class Context<T = Record<string | symbol, unknown>> {
  constructor(
    private readonly data?: T,
    // for debug purpose
    private readonly name?: string,
  ) {}

  get<K extends keyof T>(key: K): T[K];
  get(): T
  get<K extends keyof T>(key?: K): T[K] | T {
    return key ? this.data[key] : this.data;
  }

  static $$prov: ProviderDef = {
    token: Context,
    factory: () => {},
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
