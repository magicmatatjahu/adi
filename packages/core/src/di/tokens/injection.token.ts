import { ProviderDef, InjectionTokenOptions } from "../interfaces"
import { Scope } from "../scopes";

export class InjectionToken<T = any> {
  private multi: boolean = false;

  private readonly _$prov: ProviderDef<T> = undefined;

  constructor(
    options?: InjectionTokenOptions,
    private readonly name?: string,
  ) {
    // TODO: Check why TS throws error that scope is not in the InjectionTokenOptions type...
    if (options) {
      this.multi = options.multi || false;
      this._$prov = {
        ...options,
        token: this,
        factory: undefined,
        providedIn: options.providedIn,
        scope: (options as any).scope || Scope.DEFAULT,
      } as any;
    }
  }

  public isMulti(): boolean {
    return this.multi;
  }

  public getName(): string {
    return this.name;
  }
};
