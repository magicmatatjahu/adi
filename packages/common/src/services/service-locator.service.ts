import { Scope, InjectionOptions, Token, Injector } from "@adi/core";
import { ProviderDef } from "@adi/core/dist/src/di/interfaces";

export class ServiceLocator {
  constructor(
    private readonly injector: Injector,
  ) {}

  resolve<T>(token: Token<T>, options?: InjectionOptions): Promise<T | undefined> | T | undefined {
    return this.injector.resolve(token, options);
  }

  static _$prov: ProviderDef = {
    token: ServiceLocator,
    factory: (injector: Injector) => new ServiceLocator(injector),
    scope: Scope.SINGLETON,
    providedIn: "any",
  }
}
