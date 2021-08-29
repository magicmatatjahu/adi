import { Injector, Session } from "../injector";
import { InjectionArgument, InjectableOptions, ModuleMetadata } from ".";
import { Wrapper } from "../utils";
import { Token } from "../types";

export type ModuleDef = ModuleMetadata;

export interface ComponentDef {
  token: unknown;
}

export interface ProviderDef<T = any, S = any> {
  token: unknown;
  factory: FactoryDef<T>;
  options?: InjectableOptions<S>;
  injections?: InjectionArguments;
}

export interface InjectionArguments {
  parameters: Array<InjectionArgument>;
  properties: Record<string | symbol, InjectionArgument>;
  methods: Record<string, InjectionArgument[]>;
}

export interface PlainInjections {
  parameters?: Array<Token | Wrapper>;
  properties?: Record<string | symbol, Token | Wrapper>;
  methods?: Record<string, Array<Token | Wrapper>>;
  dynamic?: (injectionArg: InjectionArgument) => Token | Wrapper | undefined;
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
