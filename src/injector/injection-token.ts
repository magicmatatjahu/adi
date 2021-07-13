import { InjectionTokenOptions, ProviderDef } from "../interfaces";

export class InjectionToken<T = any> {
  constructor(
    options?: InjectionTokenOptions,
    // for debug purpose
    private readonly name?: string,
  ) {
    // TODO: Fix the shape of $$prov
    if (options !== undefined) {
      this.$$prov = {
        ...options,
        token: this,
        factory: undefined,
        scope: options.scope,
        provideIn: options.provideIn,
        options: options,
      } as ProviderDef;
    }
  }

  private readonly $$prov: ProviderDef<T> = undefined;
};
