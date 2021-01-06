import { FactoryDef } from "./definitions.interface";
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
  record: InjectionRecord<T>;
}

export interface InjectionRecord<T = any> {
  token: Token<T>;
  hostInjector: Injector;
  defs: Map<Token, RecordDefinition>;
  factory: FactoryDef<T> | undefined;
  values: Map<Context, ContextRecord<T>>;
  weakValues: WeakMap<Context, ContextRecord<T>>;
  type: ProviderType;
  scope: Scope;
  prototype: Type<T> | undefined;
  multi: Array<Provider<T>> | undefined;
  flags: InjectionRecordFlags;
}

export interface RecordDefinition<T = any> {
  factory: FactoryDef<T> | undefined;
  values: Map<Context, ContextRecord<T>>;
  weakValues: WeakMap<Context, ContextRecord<T>>;
  type: ProviderType;
  scope: Scope;
  prototype: Type<T> | undefined;
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

// TODO: change names
export interface InjectionDeps {
  ctor: InjectionConstructorDeps;
  props: InjectionPropertiesDeps,
  methods: InjectionMethodsDeps,
}

export type InjectionConstructorDeps = Array<InjectionDependency>;
export type InjectionPropertiesDeps = {
  [key: string]: InjectionDependency,
}
export type InjectionMethodsDeps = {
  [key: string]: Array<InjectionDependency>,
}

export interface InjectionDependency<T = any> {
  value: T;
  factory: FactoryDef<T> | undefined;
  hasValue: boolean;
}
