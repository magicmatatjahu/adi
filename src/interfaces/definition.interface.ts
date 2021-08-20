import { Injector, Session } from "../injector";
import { InjectionArgument, InjectableOptions, ModuleMetadata, ScopeType, ProvideInType } from ".";

export type ModuleDef = ModuleMetadata;

export interface ComponentDef {
  token: unknown;
}

export interface ProviderDef<T = any, S = any> {
  token: unknown;
  factory: FactoryDef<T>;
  provideIn?: ProvideInType | ProvideInType[];
  scope?: ScopeType<S>;
  options?: InjectableOptions<S>;
  args?: {
    parameters: Array<InjectionArgument>;
    properties: Record<string | symbol, InjectionArgument>;
    methods: Record<string, InjectionArgument[]>;
  };
}

export type FactoryDef<T = any> = (
  injector: Injector, 
  session: Session, 
) => Promise<T | undefined> | T | undefined;

export type ConstraintDef = (session: Session) => boolean;

export type NextWrapper<T = any> = (
  injector: Injector, 
  session: Session,
) => Promise<T | undefined> | T | undefined;

export type WrapperDef<T = any> = (injector: Injector, session: Session, next: NextWrapper) => Promise<T> | T;
