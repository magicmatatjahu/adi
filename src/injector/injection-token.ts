import { InjectionTokenOptions, ProviderDef } from "../interfaces";

export class InjectionToken<T = any> {
  constructor(
    options?: InjectionTokenOptions,
    // for debug purpose
    private readonly name?: string,
  ) {
    if (options !== undefined) {
      this.$$prov = {
        ...options,
        token: this,
        factory: undefined,
      } as any;
    }
  }

  private readonly $$prov: ProviderDef<T> = undefined;
};
