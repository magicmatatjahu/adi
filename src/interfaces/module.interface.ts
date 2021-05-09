import { Provider, ForwardRef, Type } from ".";
import { Token } from "../types";

export interface ModuleMetadata<T = any> {
  id?: string | symbol;
  imports?: Array<
    | Type
    | DynamicModule<T>
    | Promise<DynamicModule<T>>
    | ForwardRef
  >;
  components?: Array<Type>;
  providers?: Array<Provider>;
  exports?: Array<
    | Token
    | Provider
    // TODO: Add DynamicModule and/or Promise<DynamicModule>> ?
    //| DynamicModule
    //| Promise<DynamicModule>> ?
    // | ForwardRef
  >;
}

export interface DynamicModule<T = any> extends ModuleMetadata<T> {
  module: Type<T>;
}

export type ModuleID = string | symbol;
