import { Injector } from "../injector";
import { Provider, CustomProvider, ProviderDef } from "../interfaces";
import { Scope } from "../scopes";
import { Token } from "../types";

export class Binder {
  constructor(
    private readonly injector: Injector,
  ) {}

  use<T>(provider: Provider<T>): void {
    this.injector.addProvider(provider as any);
  }

  provide<T>(token: Token<T>, provider: Omit<CustomProvider<T>, "provide">): void {
    (provider as CustomProvider).provide = token;
    this.injector.addProvider(provider as CustomProvider);
  }

  static _$prov: ProviderDef = {
    token: Binder,
    factory: (inj: Injector) => new Binder(inj),
    scope: Scope.SINGLETON,
    providedIn: "any",
  }
}
