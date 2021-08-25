import { Context, Injector, ProviderRecord } from "../injector";
import { InjectionStatus } from "../enums";
import { Scope } from "../scope";
import { ConstraintDef, FactoryDef, ScopeShape, Type } from ".";
import { Wrapper } from "../utils/wrappers";

export interface DefinitionRecord<T = any, S = any> {
  record: ProviderRecord<T>;
  factory: FactoryDef<T> | undefined;
  constraint: ConstraintDef | undefined;
  wrapper: Wrapper;
  scope: ScopeShape<S>;
  annotations: Record<string | symbol, any>;
  proto: Type<T> | undefined;
  values: Map<Context, InstanceRecord<T>>;
  // weakValues: WeakMap<Context, InstanceRecord<T>>;
  // flags: InjectionRecordFlags;
  // original: Provider;
}

export interface WrapperRecord {
  wrapper: Wrapper,
  constraint: ConstraintDef;
  annotations: Record<string | symbol, any>;
}

export interface InstanceRecord<T = any> {
  ctx: Context,
  value: T;
  status: InjectionStatus;
  def: DefinitionRecord;
  // // what is injected to instance
  // children: Set<InstanceRecord>;
  // // where instance is injected
  // parents: Set<InstanceRecord>;
}

export interface ComponentRecord<T = any> {
  comp: Type<T>;
  host: Injector;
  factory: FactoryDef<T> | undefined;
  useWrapper: Wrapper;
  scope: Scope;
  values: Map<Context, ComponentInstanceRecord<T>>;
}

export interface ComponentInstanceRecord<T = any> {
  ctx: Context;
  value: T;
  comp: ComponentRecord;
  // // what is injected to instance
  // children: Set<InstanceRecord>;
  // // where instance is injected
  // parents: Set<InstanceRecord>;
}
