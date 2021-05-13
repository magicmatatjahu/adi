import { Provider, ForwardRef, Type } from ".";
import { Injector } from "../injector";
import { Token } from "../types";

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
    | DynamicModule
    | Promise<DynamicModule>
    | ForwardRef
  >;
}

export interface DynamicModule<T = any> extends ModuleMetadata {
  id?: ModuleID;
  module: Type<T>;
}

export type ModuleID = string | symbol;

export interface ModulesGraphItem {
  mod: Type,
  distance: number;
  possibleParent: Injector; 
}

export type ModulesGraph = Map<Type, Map<ModuleID, ModulesGraphItem>>;
