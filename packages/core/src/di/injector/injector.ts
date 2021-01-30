import { Token } from "../types";
import { InjectionOptions, InjectionSession, Type, Provider } from "../interfaces";

export abstract class Injector {
  abstract resolve<T>(token: Token<T>, options?: InjectionOptions, session?: InjectionSession, sync?: boolean): Promise<T | undefined> | T | undefined;
  abstract resolveSync<T>(token: Token<T>, options?: InjectionOptions, session?: InjectionSession, sync?: boolean): T | undefined;

  abstract resolveComponent<T>(component: Type<T>): Promise<T | never>;
  abstract resolveComponentSync<T>(component: Type<T>): T | never;

  abstract getParentInjector(): Injector | null;
  abstract compile(): Promise<void>;

  abstract addProviders(providers: Provider[]): void;
  abstract addProvider<T>(provider: Provider<T>): void;
  abstract addComponents(components: Type[]): void;
  abstract addComponent<T>(component: Type<T>): void;
  abstract import(): Injector;
}
