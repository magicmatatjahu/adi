import { Context, Injector, ProviderRecord } from "../injector";
import { InjectionStatus } from "../enums";
import { Scope } from "../scope";
import { ConstraintDef, FactoryDef, WrapperDef, ScopeShape, Type } from ".";

// export interface ProviderRecord<T = any> {
//   token: Token<T>;
//   hostInjector: Injector;
//   defs: Array<DefinitionRecord>;
//   constraintDefs: Array<DefinitionRecord>;
//   wrappers: Array<WrapperRecord>;
// }

export interface DefinitionRecord<T = any, S = any> {
  record: ProviderRecord<T>;
  factory: FactoryDef<T> | undefined;
  constraint: ConstraintDef | undefined;
  wrapper: WrapperDef | undefined;
  scope: ScopeShape<S>;
  annotations: Record<string | symbol, any>;
  proto: Type<T> | undefined;
  values: Map<Context, InstanceRecord<T>>;
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

export interface ComponentRecord<T = any> {
  comp: Type<T>;
  host: Injector;
  factory: FactoryDef<T> | undefined;
  useWrapper: WrapperDef | undefined;
  scope: Scope;
  values: Map<Context, ComponentInstanceRecord<T>>;
}

export interface ComponentInstanceRecord<T = any> {
  ctx: Context;
  value: T;
  comp: ComponentRecord;
}
