import { ModuleMeta } from "./module.interface";
import { InjectionArgument, MethodArgument } from "./injection-argument.interface";
import { ContextRecord } from "./records.interface";
import { Type } from "./type.interface";
import { Injector } from "../injector";
import { Scope } from "../scopes";
import { ProviderDefFlags } from "../enums";
import { InjectionOptions } from "./injection-options.interface";

export type ModuleDef<T = any> = ModuleMeta<T>;

export interface ComponentDef<M = any> {
  type: string | symbol;
  metadata: M;
}

export interface ProviderDef<T = any> {
  token: unknown;
  factory: FactoryDef<T>;
  scope: Scope;
  flags?: ProviderDefFlags,
  providedIn?: string | symbol | Type;
  args?: ProviderDefArguments;
}

export interface ProviderDefArguments {
  ctor: ConstructorArguments;
  props: PropertiesArguments;
  methods: MethodsArguments;
}

export type ConstructorArguments = Array<InjectionArgument>;
export type PropertiesArguments = {
  [key: string]: InjectionArgument;
}
export type MethodsArguments = {
  [key: string]: MethodArgument;
}

export type FactoryDef<T = any> = (injector: Injector, session: InjectionSession, sync?: boolean) => Promise<T | undefined> | T | undefined;  

export interface InjectionSession<T = any> {
  options: InjectionOptions;
  ctxRecord: ContextRecord<T>;
  parent?: InjectionSession;
}

export type ConstraintFunction = (options: InjectionOptions, session: InjectionSession) => boolean;
