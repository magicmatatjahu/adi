import { ModuleMeta } from "./module.interface";
import { InjectableOptions } from "./injectable-options.interface";
import { InjectionArgument, MethodArgument } from "./injection-argument.interface";
import { InjectionContext } from "./injection-context.interface";
import { ContextRecord } from "./records.interface";
import { Type } from "./type.interface";
import { Injector } from "../injector";
import { Scope } from "../scopes";
import { ProviderDefFlags } from "../enums";
import { Token } from "../types";

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

export type FactoryDef<T = any> = (injector: Injector, inquirer?: InquirerDef, sync?: boolean) => Promise<T | undefined> | T | undefined;  

export interface InquirerDef<T = any> {
  ctxRecord: ContextRecord<T>;
  options: InjectableOptions;
  inquirer?: InquirerDef;
}

export type Inquirer<T = any> = InquirerDef<T>;

export type ConstraintFunction = (context: InjectionContext) => boolean;
