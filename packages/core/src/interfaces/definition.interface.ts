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

export type InjectionItem<T = any> = Token<T> | Wrapper | Array<Wrapper> | { token: Token<T>, wrapper?: Wrapper | Array<Wrapper> };

export interface PlainInjections {
  parameters?: Array<InjectionItem>;
  properties?: Record<string | symbol, InjectionItem>;
  methods?: Record<string, Array<InjectionItem>>;
  dynamic?: (injectionArg: InjectionArgument) => InjectionItem | undefined;
}

export type FactoryDef<T = any> = (
  injector: Injector, 
  session: Session, 
) => Promise<T | undefined> | T | undefined;

export type ConstraintDef = (session: Session) => boolean;

export type NextWrapper<T = any> = (session: Session) => Promise<T | undefined> | T | undefined;
export type WrapperDef<T = any> = (session: Session, next: NextWrapper) => Promise<T> | T;
