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
      const scope = (options as any).scope || (this.multi === true ? Scope.PROTOTYPE : Scope.DEFAULT);
      this._$prov = {
        ...options,
        token: this,
        providedIn: options.providedIn,
        scope,
        factory: undefined,
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
