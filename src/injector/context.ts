import { ProviderDef } from "../interfaces";

export class Context<T = any> {
  constructor(
    private readonly data?: T,
    // for debug purpose
    private readonly name?: string,
  ) {}

  static $$prov: ProviderDef = {
    token: Context,
    factory: (_, session) => {
      const parentSession = session.getParent();
      if (parentSession === undefined) {
        throw new Error('Context provider can be only used in other providers');
      }
      return parentSession.getInstance().ctx;
    },
    options: {
      provideIn: 'any',
    }
    // scope: Scope.INSTANCE is added in `index.ts` file due to circular references between `injector` dir and `scope` file  
  };
}
