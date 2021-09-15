import { Provider, ForwardRef, Type } from ".";
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
}

export type ModuleID = string | symbol;

export type ImportItem = 
  | Type
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardRef;

export type ExportItem = 
  | Token
  | Provider
  | ExportedModule
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
  injector: Injector;
  exportTo: Injector;
  isProxy: boolean;
}