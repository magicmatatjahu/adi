import { Injector, Session } from "../injector";
import { Scope } from "../scope";
import { InjectionSession, InjectionArgument, ModuleMetadata, ProvideInType } from ".";
import { InjectableOptions } from "./injectable.interface";

export type ModuleDef = ModuleMetadata;

export interface ComponentDef {
  token: unknown;
}

export interface ProviderDef<T = any> {
  token: unknown;
  factory: FactoryDef<T>;
  provideIn?: ProvideInType | ProvideInType[];
  scope?: Scope;
  options?: InjectableOptions;
  args?: {
    ctor: Array<InjectionArgument>;
    props: {
      [prop: string]: InjectionArgument;
    };
    methods: {
      [method: string]: Array<InjectionArgument>;
    };
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
