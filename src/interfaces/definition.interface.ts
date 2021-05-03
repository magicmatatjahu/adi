import { Injector } from "../injector";
import { Scope } from "../scope";
import { InjectionSession, InjectionArgument, Type } from ".";

export interface ProviderDef<T = any> {
  token: unknown;
  factory: FactoryDef<T>;
  scope?: Scope;
  providedIn?: string | symbol | Type;
  args?: {
    ctor: Array<InjectionArgument>;
    props: {
      [prop: string]: InjectionArgument;
    };
    methods: {
      [method: string]: InjectionArgument;
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
