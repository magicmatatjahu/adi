import { Token } from "../types";
import { InquirerDef, InjectionOptions, Type, Provider } from "../interfaces";

export abstract class Injector {
  abstract resolve<T>(token: Token<T>, options?: InjectionOptions, inquirer?: InquirerDef, sync?: boolean): Promise<T | undefined> | T | undefined;
  abstract resolveSync<T>(token: Token<T>, options?: InjectionOptions, inquirer?: InquirerDef, sync?: boolean): T | undefined;

  abstract async resolveComponent<T>(component: Type<T>): Promise<T | never>;
  abstract resolveComponentSync<T>(component: Type<T>): T | never;

  abstract getParentInjector(): Injector | null;
  abstract async compile(): Promise<void>;

  abstract addProviders(providers: Provider[]): void;
  abstract addProvider<T>(provider: Provider<T>): void;
  abstract addComponents(components: Type[]): void;
  abstract addComponent<T>(component: Type<T>): void;
  abstract import(): Injector;
  abstract getScope(): string | symbol | Type;
}
