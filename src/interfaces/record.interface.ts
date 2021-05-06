import { Injector, Context } from "../injector";
import { InjectionStatus } from "../enums";
import { Token } from "../types";
import { Scope } from "../scope";
import { ConstraintDef, FactoryDef, WrapperDef, Type } from ".";

export interface ProviderRecord<T = any> {
  token: Token<T>;
  hostInjector: Injector;
  defs: Array<DefinitionRecord>;
  defaultDef: DefinitionRecord;
  wrappers: Array<WrapperRecord>;
  // isMulti: boolean;
}

export interface DefinitionRecord<T = any> {
  record: ProviderRecord<T>;
  factory: FactoryDef<T> | undefined;
  constraint: ConstraintDef;
  values: Map<Context, InstanceRecord<T>>;
  scope: Scope;
  proto: Type<T> | undefined;
  wrapper: WrapperDef;
  // weakValues: WeakMap<Context, InstanceRecord<T>>;
  // flags: InjectionRecordFlags;
  // original: Provider;
}

export interface WrapperRecord<T = any> {
  wrapper: WrapperDef<T>,
  constraint: ConstraintDef;
}

export interface InstanceRecord<T = any> {
  ctx: Context,
  value: T;
  status: InjectionStatus;
  def: DefinitionRecord;
}