import { ModuleType } from "../enums";
import { ForwardRef } from "./refs.interface";
import { Provider } from "./provider.interface";
import { Type } from "./type.interface";
import { Token } from "../types";

export interface ModuleMeta<T = any> {
  type?: ModuleType;
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
    | ForwardRef
  >;
}

export interface DynamicModule<T = any> extends ModuleMeta<T> {
  module: Type<T>;
}
