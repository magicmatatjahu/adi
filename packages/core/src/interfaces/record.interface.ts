import { Context, Injector, ProviderRecord } from "../injector";
import { InjectionStatus } from "../enums";
import { Scope } from "../scope";
import { ConstraintDef, FactoryDef, ScopeShape, Type } from ".";
import { Wrapper } from "../utils/wrappers";

export interface DefinitionRecord<T = any, S = any> {
  name: string;
  values: Map<Context, InstanceRecord<T>>;
  record: ProviderRecord<T>;
  factory: FactoryDef<T> | undefined;
  constraint: ConstraintDef | undefined;
  wrapper: Wrapper;
  scope: ScopeShape<S>;
  annotations: Record<string | symbol, any>;
  proto: Type<T> | undefined;
}

export interface InstanceRecord<T = any> {
  ctx: Context,
  value: T;
  status: InjectionStatus;
  def: DefinitionRecord;
  scope: ScopeShape;
  // for pararell resolution
  donePromise?: Promise<T>;
  doneResolve?: (value: T) => void;
  // what is injected to instance
  children: Set<InstanceRecord>;
  // where instance is injected
  parents: Set<InstanceRecord>;
}

export interface WrapperRecord {
  wrapper: Wrapper,
  constraint: ConstraintDef;
  annotations: Record<string | symbol, any>;
}
