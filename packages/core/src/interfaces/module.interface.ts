import { InjectionItem, Provider, ForwardRef, Type, FactoryDef } from ".";
import { Injector } from "../injector";
import { Token } from "../types";
import { ModuleDef } from "./definition.interface";

export interface ModuleMetadata {
  imports?: Array<ImportItem>;
  components?: Array<Provider>;
  providers?: Array<Provider>;
  exports?: Array<ExportItem>;
}

export interface DynamicModule<T = any> extends ModuleMetadata {
  module: Type<T>;
  id?: ModuleID;
  useFactory?: (...args: any[]) => ModuleMetadata | Promise<ModuleMetadata> | void | Promise<void>;
  inject?: Array<InjectionItem>;
}

export type ModuleID = string | symbol;

export type ImportItem = 
  | Type
  | DynamicModule
  | Promise<DynamicModule>
  | Promise<Type | DynamicModule>
  | ForwardRef;

export type ExportItem = 
  | Token
  | Provider
  | ExportedModule
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardRef;

export interface ExportedModule {
  module: Type;
  id?: ModuleID; 
  providers: Array<Token | Provider>;
}

export interface CompiledModule {
  type: Type;
  moduleDef: ModuleDef;
  dynamicDef: DynamicModule;
  useFactory: FactoryDef<ModuleMetadata>;
  injector: Injector;
  exportTo: Injector;
  isProxy: boolean;
  stack: CompiledModule[];
}