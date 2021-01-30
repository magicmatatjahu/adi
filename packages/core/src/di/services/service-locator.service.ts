import { Injector, resolver } from "../injector";
import { ProviderDef, InjectionOptions, InjectionSession } from "../interfaces";
import { Token } from "../types";
import { Scope } from "../scopes";

export class ServiceLocator {
  constructor(
    private readonly injector: Injector,
  ) {}

  resolve<T>(token: Token<T>, options?: InjectionOptions, sync?: boolean, session?: InjectionSession): Promise<T | undefined> | T | undefined {
    return this.injector.resolve(token, options, session, sync);
  }

  resolveSync<T>(token: Token<T>, options?: InjectionOptions, session?: InjectionSession): Promise<T | undefined> | T | undefined {
    return this.injector.resolveSync(token, options, session, true);
  }

  resolveInstance() {

  }

  injectMembers() {

  }

  static _$prov: ProviderDef = {
    token: ServiceLocator,
    factory: (inj: Injector) => new ServiceLocator(inj),
    scope: Scope.SINGLETON,
    providedIn: "any",
  }
}
