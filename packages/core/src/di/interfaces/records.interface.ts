import { FactoryDef, ConstraintFunction } from "./definitions.interface";
import { Provider } from "./provider.interface";
import { Type } from "./type.interface";
import { InjectionStatus, ProviderType, ModuleType, InjectionRecordFlags } from "../enums";
import { Injector } from "../injector";
import { Context } from "../tokens";
import { Token } from "../types";
import { Scope } from "../scopes";

export interface ContextRecord<T = any> {
  ctx: Context,
  value: T;
  status: InjectionStatus;
  def: RecordDefinition;
}

export interface InjectionRecord<T = any> {
  token: Token<T>;
  hostInjector: Injector;
  defaultDef: RecordDefinition;
  defs: Array<RecordDefinition>;
  isMulti: boolean;
}

export interface RecordDefinition<T = any> {
  factory: FactoryDef<T> | undefined;
  constraint: ConstraintFunction;
  values: Map<Context, ContextRecord<T>>;
  weakValues: WeakMap<Context, ContextRecord<T>>;
  type: ProviderType;
  scope: Scope;
  prototype: Type<T> | undefined;
  flags: InjectionRecordFlags;
  record: InjectionRecord<T>;
  original: Provider;
}

export interface InjectorContextRecord<I = Injector> {
  ctx: Context,
  injector: I,
  type: ModuleType,
}

export interface InjectorRecord<T = any, I = Injector> {
  module: Type<T>;
  values: Map<Context, InjectorContextRecord<I>>;
}
