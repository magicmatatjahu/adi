import { Injector } from "../injector";
import { Scope } from "../scope";
import { InjectionSession, InjectionArgument, ModuleMetadata, ProvideInType } from ".";

export type ModuleDef = ModuleMetadata;

export interface ComponentDef {
  token: unknown;
}

export interface ProviderDef<T = any> {
  token: unknown;
  factory: FactoryDef<T>;
  providedIn?: ProvideInType | ProvideInType[];
  scope?: Scope;
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
  session: InjectionSession, 
) => Promise<T | undefined> | T | undefined;

export type ConstraintDef = (session: InjectionSession) => boolean;

export type NextWrapper<T = any> = (
  injector: Injector, 
  session: InjectionSession
) => Promise<T | undefined> | T | undefined;

export type WrapperDef<T = any> = (injector: Injector, session: InjectionSession, next: NextWrapper) => Promise<T> | T;
