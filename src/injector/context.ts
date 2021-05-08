import { ProviderDef } from "../interfaces";

export class Context<T = any> {
  constructor(
    private readonly data?: T,
    private readonly name?: string,
  ) {}

  static $$prov: ProviderDef = {
    token: Context,
    factory: (_, session) => {
      const parentSession = session.parent;
      if (parentSession === undefined) {
        throw new Error('Context provider can be only used in other providers');
      }
      return parentSession.instance.ctx;
    },
    providedIn: 'any',
    // scope: Scope.INSTANCE is added in `index.ts` file due to circular references between `injector` dir and `scope` file  
  };
}
