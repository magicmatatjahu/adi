import { Provider, ForwardRef, Type } from ".";
import { Injector } from "../injector";
import { Token } from "../types";
import { ModuleDef } from "./definition.interface";

export interface ModuleMetadata {
  imports?: Array<
    | Type
    | DynamicModule
    | Promise<DynamicModule>
    | ForwardRef
  >;
  components?: Array<Type>;
  providers?: Array<Provider>;
  exports?: Array<
    | Token
    | Provider
    | ExportedModule
    | ForwardRef
  >;
}

export interface DynamicModule<T = any> extends ModuleMetadata {
  id?: ModuleID;
  module: Type<T>;
}

export type ModuleID = string | symbol;

export interface CompiledModule {
  mod: Type;
  moduleDef: ModuleDef;
  dynamicDef: DynamicModule;
  injector: Injector;
  exportTo: Injector;
  isFacade: boolean;
}

export interface ExportedModule {
  module: Type;
  id?: ModuleID; 
  providers: Array<Token | Provider>;
}