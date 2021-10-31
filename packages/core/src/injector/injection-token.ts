import { InjectionTokenOptions, ProviderDef } from "../interfaces";

export class InjectionToken<T> {
  constructor(
    options?: InjectionTokenOptions<unknown>,
    // for debug purpose
    private readonly name?: string,
  ) {
    // TODO: Fix the shape of $$prov
    if (options !== undefined) {
      this.$$prov = {
        ...options,
        token: this,
        factory: undefined,
        options: options,
      } as ProviderDef;
    }
  }

  private readonly $$prov: ProviderDef;
};
