import { Injector, Session } from "../injector";
import { InjectionArguments, InjectableOptions, ModuleMetadata } from ".";

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

export type FactoryDef<T = any> = (
  injector: Injector, 
  session: Session, 
) => Promise<T | undefined> | T | undefined;

export type FunctionDef<T = any> = (
  injector: Injector, 
  session: Session, 
  ...args: any[]
) => Promise<T | undefined> | T | undefined;

export type ConstraintDef = (session: Session) => boolean;

export type NextWrapper<T = any> = (session: Session) => Promise<T | undefined> | T | undefined;
export type WrapperDef<T = any> = (session: Session, next: NextWrapper) => Promise<T> | T;
